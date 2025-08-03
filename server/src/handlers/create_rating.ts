
import { db } from '../db';
import { ratingsTable, novelsTable } from '../db/schema';
import { type CreateRatingInput, type Rating } from '../schema';
import { eq, avg, and } from 'drizzle-orm';

export const createRating = async (input: CreateRatingInput): Promise<Rating> => {
  try {
    // Check if user has already rated this novel
    const existingRating = await db.select()
      .from(ratingsTable)
      .where(and(
        eq(ratingsTable.user_id, input.user_id),
        eq(ratingsTable.novel_id, input.novel_id)
      ))
      .execute();

    let result;

    if (existingRating.length > 0) {
      // Update existing rating
      result = await db.update(ratingsTable)
        .set({
          rating: input.rating,
          review: input.review || null,
          updated_at: new Date()
        })
        .where(eq(ratingsTable.id, existingRating[0].id))
        .returning()
        .execute();
    } else {
      // Create new rating
      result = await db.insert(ratingsTable)
        .values({
          user_id: input.user_id,
          novel_id: input.novel_id,
          rating: input.rating,
          review: input.review || null
        })
        .returning()
        .execute();
    }

    // Calculate and update novel's average rating
    const avgRatingResult = await db.select({
      avgRating: avg(ratingsTable.rating)
    })
      .from(ratingsTable)
      .where(eq(ratingsTable.novel_id, input.novel_id))
      .execute();

    const averageRating = avgRatingResult[0]?.avgRating;
    
    if (averageRating !== null && averageRating !== undefined) {
      await db.update(novelsTable)
        .set({
          average_rating: averageRating.toString(),
          updated_at: new Date()
        })
        .where(eq(novelsTable.id, input.novel_id))
        .execute();
    }

    return result[0];
  } catch (error) {
    console.error('Rating creation/update failed:', error);
    throw error;
  }
};

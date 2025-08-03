
import { db } from '../db';
import { ratingsTable, usersTable } from '../db/schema';
import { type Rating } from '../schema';
import { eq } from 'drizzle-orm';

export async function getRatings(novelId: number): Promise<Rating[]> {
  try {
    // Query ratings with user information joined
    const results = await db.select({
      id: ratingsTable.id,
      user_id: ratingsTable.user_id,
      novel_id: ratingsTable.novel_id,
      rating: ratingsTable.rating,
      review: ratingsTable.review,
      created_at: ratingsTable.created_at,
      updated_at: ratingsTable.updated_at
    })
    .from(ratingsTable)
    .innerJoin(usersTable, eq(ratingsTable.user_id, usersTable.id))
    .where(eq(ratingsTable.novel_id, novelId))
    .execute();

    // Convert the results to match the Rating schema
    return results.map(result => ({
      id: result.id,
      user_id: result.user_id,
      novel_id: result.novel_id,
      rating: result.rating,
      review: result.review,
      created_at: result.created_at,
      updated_at: result.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch ratings:', error);
    throw error;
  }
}

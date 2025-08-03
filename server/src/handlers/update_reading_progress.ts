
import { db } from '../db';
import { readingProgressTable } from '../db/schema';
import { type UpdateReadingProgressInput, type ReadingProgress } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateReadingProgress = async (input: UpdateReadingProgressInput): Promise<ReadingProgress> => {
  try {
    // Check if reading progress record already exists for this user-novel combination
    const existingProgress = await db.select()
      .from(readingProgressTable)
      .where(and(
        eq(readingProgressTable.user_id, input.user_id),
        eq(readingProgressTable.novel_id, input.novel_id)
      ))
      .execute();

    let result;

    if (existingProgress.length > 0) {
      // Update existing record
      const updateResult = await db.update(readingProgressTable)
        .set({
          chapter_id: input.chapter_id,
          progress_percentage: input.progress_percentage.toString(),
          last_read_at: new Date(),
          updated_at: new Date()
        })
        .where(and(
          eq(readingProgressTable.user_id, input.user_id),
          eq(readingProgressTable.novel_id, input.novel_id)
        ))
        .returning()
        .execute();

      result = updateResult[0];
    } else {
      // Create new record
      const insertResult = await db.insert(readingProgressTable)
        .values({
          user_id: input.user_id,
          novel_id: input.novel_id,
          chapter_id: input.chapter_id,
          progress_percentage: input.progress_percentage.toString(),
          last_read_at: new Date()
        })
        .returning()
        .execute();

      result = insertResult[0];
    }

    // Convert numeric fields back to numbers before returning
    return {
      ...result,
      progress_percentage: parseFloat(result.progress_percentage)
    };
  } catch (error) {
    console.error('Reading progress update failed:', error);
    throw error;
  }
};

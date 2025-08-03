
import { db } from '../db';
import { readingProgressTable } from '../db/schema';
import { type ReadingProgress } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getReadingProgress(userId: number, novelId?: number): Promise<ReadingProgress[]> {
  try {
    const conditions: SQL<unknown>[] = [eq(readingProgressTable.user_id, userId)];

    if (novelId !== undefined) {
      conditions.push(eq(readingProgressTable.novel_id, novelId));
    }

    const results = await db.select()
      .from(readingProgressTable)
      .where(and(...conditions))
      .execute();

    return results.map(result => ({
      ...result,
      progress_percentage: parseFloat(result.progress_percentage)
    }));
  } catch (error) {
    console.error('Failed to fetch reading progress:', error);
    throw error;
  }
}

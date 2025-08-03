
import { db } from '../db';
import { chaptersTable } from '../db/schema';
import { type Chapter } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getChapters(novelId: number): Promise<Chapter[]> {
  try {
    const results = await db.select()
      .from(chaptersTable)
      .where(eq(chaptersTable.novel_id, novelId))
      .orderBy(asc(chaptersTable.chapter_number))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(chapter => ({
      ...chapter,
      coin_cost: parseFloat(chapter.coin_cost)
    }));
  } catch (error) {
    console.error('Failed to fetch chapters:', error);
    throw error;
  }
}

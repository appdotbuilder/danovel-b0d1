
import { db } from '../db';
import { chaptersTable } from '../db/schema';
import { type UpdateChapterInput, type Chapter } from '../schema';
import { eq } from 'drizzle-orm';

export const updateChapter = async (input: UpdateChapterInput): Promise<Chapter> => {
  try {
    // First, get the current chapter to check if it exists
    const existingChapter = await db.select()
      .from(chaptersTable)
      .where(eq(chaptersTable.id, input.id))
      .execute();

    if (existingChapter.length === 0) {
      throw new Error(`Chapter with id ${input.id} not found`);
    }

    const current = existingChapter[0];

    // Calculate word count only if content is being updated
    let wordCount = current.word_count;
    if (input.content !== undefined) {
      wordCount = input.content.trim() === '' ? 0 : input.content.trim().split(/\s+/).length;
    }

    // Determine published_at based on status
    let publishedAt = current.published_at;
    if (input.status === 'published' && current.status !== 'published') {
      // First time publishing
      publishedAt = new Date();
    } else if (input.status && input.status !== 'published') {
      // Changing from published to another status
      publishedAt = null;
    }

    // Update the chapter
    const result = await db.update(chaptersTable)
      .set({
        title: input.title,
        content: input.content,
        word_count: wordCount,
        status: input.status,
        is_premium: input.is_premium,
        coin_cost: input.coin_cost ? input.coin_cost.toString() : undefined,
        published_at: publishedAt,
        updated_at: new Date()
      })
      .where(eq(chaptersTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const chapter = result[0];
    return {
      ...chapter,
      coin_cost: parseFloat(chapter.coin_cost)
    };
  } catch (error) {
    console.error('Chapter update failed:', error);
    throw error;
  }
};


import { db } from '../db';
import { chaptersTable, novelsTable, usersTable } from '../db/schema';
import { type CreateChapterInput, type Chapter } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createChapter = async (input: CreateChapterInput): Promise<Chapter> => {
  try {
    // Verify novel exists and get author information
    const novelResult = await db.select({
      id: novelsTable.id,
      author_id: novelsTable.author_id,
      total_chapters: novelsTable.total_chapters
    })
      .from(novelsTable)
      .where(eq(novelsTable.id, input.novel_id))
      .execute();

    if (novelResult.length === 0) {
      throw new Error('Novel not found');
    }

    const novel = novelResult[0];

    // Verify author exists
    const authorResult = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, novel.author_id))
      .execute();

    if (authorResult.length === 0) {
      throw new Error('Author not found');
    }

    // Check if chapter number already exists for this novel
    const existingChapter = await db.select({ id: chaptersTable.id })
      .from(chaptersTable)
      .where(and(
        eq(chaptersTable.novel_id, input.novel_id),
        eq(chaptersTable.chapter_number, input.chapter_number)
      ))
      .execute();

    if (existingChapter.length > 0) {
      throw new Error('Chapter number already exists for this novel');
    }

    // Calculate word count
    const wordCount = input.content.trim().split(/\s+/).length;

    // Set published_at if status is published
    const publishedAt = input.status === 'published' ? new Date() : null;

    // Insert chapter record
    const result = await db.insert(chaptersTable)
      .values({
        novel_id: input.novel_id,
        chapter_number: input.chapter_number,
        title: input.title,
        content: input.content,
        word_count: wordCount,
        status: input.status,
        is_premium: input.is_premium,
        coin_cost: input.coin_cost.toString(), // Convert number to string for numeric column
        published_at: publishedAt
      })
      .returning()
      .execute();

    // Update novel's total chapters count
    await db.update(novelsTable)
      .set({
        total_chapters: novel.total_chapters + 1,
        updated_at: new Date()
      })
      .where(eq(novelsTable.id, input.novel_id))
      .execute();

    // Convert numeric fields back to numbers before returning
    const chapter = result[0];
    return {
      ...chapter,
      coin_cost: parseFloat(chapter.coin_cost) // Convert string back to number
    };
  } catch (error) {
    console.error('Chapter creation failed:', error);
    throw error;
  }
};

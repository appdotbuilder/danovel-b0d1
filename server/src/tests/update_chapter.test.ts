
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chaptersTable, novelsTable, usersTable, genresTable } from '../db/schema';
import { type UpdateChapterInput } from '../schema';
import { updateChapter } from '../handlers/update_chapter';
import { eq } from 'drizzle-orm';

describe('updateChapter', () => {
  let testUserId: number;
  let testGenreId: number;
  let testNovelId: number;
  let testChapterId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'writer'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test genre
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();
    testGenreId = genreResult[0].id;

    // Create test novel
    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: testUserId,
        genre_id: testGenreId,
        status: 'ongoing'
      })
      .returning()
      .execute();
    testNovelId = novelResult[0].id;

    // Create test chapter
    const chapterResult = await db.insert(chaptersTable)
      .values({
        novel_id: testNovelId,
        chapter_number: 1,
        title: 'Original Title',
        content: 'Original content for the chapter',
        word_count: 5, // Set explicit word count that matches what we expect
        status: 'draft',
        is_premium: false,
        coin_cost: '0'
      })
      .returning()
      .execute();
    testChapterId = chapterResult[0].id;
  });

  afterEach(resetDB);

  it('should update chapter title without changing word count', async () => {
    const input: UpdateChapterInput = {
      id: testChapterId,
      title: 'Updated Chapter Title'
    };

    const result = await updateChapter(input);

    expect(result.title).toEqual('Updated Chapter Title');
    expect(result.content).toEqual('Original content for the chapter');
    expect(result.word_count).toEqual(5); // Should preserve original word count
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update chapter content and recalculate word count', async () => {
    const newContent = 'This is the updated content with more words than before';
    const input: UpdateChapterInput = {
      id: testChapterId,
      content: newContent
    };

    const result = await updateChapter(input);

    expect(result.content).toEqual(newContent);
    expect(result.word_count).toEqual(10); // "This is the updated content with more words than before" = 10 words
    expect(result.title).toEqual('Original Title');
  });

  it('should update chapter status to published and set published_at', async () => {
    const input: UpdateChapterInput = {
      id: testChapterId,
      status: 'published'
    };

    const result = await updateChapter(input);

    expect(result.status).toEqual('published');
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at).not.toBeNull();
  });

  it('should update premium settings and coin cost', async () => {
    const input: UpdateChapterInput = {
      id: testChapterId,
      is_premium: true,
      coin_cost: 50
    };

    const result = await updateChapter(input);

    expect(result.is_premium).toBe(true);
    expect(result.coin_cost).toEqual(50);
    expect(typeof result.coin_cost).toBe('number');
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateChapterInput = {
      id: testChapterId,
      title: 'New Title',
      content: 'New content with different word count',
      status: 'published',
      is_premium: true,
      coin_cost: 25
    };

    const result = await updateChapter(input);

    expect(result.title).toEqual('New Title');
    expect(result.content).toEqual('New content with different word count');
    expect(result.word_count).toEqual(6); // "New content with different word count" = 6 words
    expect(result.status).toEqual('published');
    expect(result.is_premium).toBe(true);
    expect(result.coin_cost).toEqual(25);
    expect(result.published_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const input: UpdateChapterInput = {
      id: testChapterId,
      title: 'Database Test Title',
      content: 'Database test content'
    };

    await updateChapter(input);

    const chapters = await db.select()
      .from(chaptersTable)
      .where(eq(chaptersTable.id, testChapterId))
      .execute();

    expect(chapters).toHaveLength(1);
    expect(chapters[0].title).toEqual('Database Test Title');
    expect(chapters[0].content).toEqual('Database test content');
    expect(chapters[0].word_count).toEqual(3); // "Database test content" = 3 words
  });

  it('should clear published_at when changing from published to draft', async () => {
    // First publish the chapter
    await updateChapter({
      id: testChapterId,
      status: 'published'
    });

    // Then change back to draft
    const result = await updateChapter({
      id: testChapterId,
      status: 'draft'
    });

    expect(result.status).toEqual('draft');
    expect(result.published_at).toBeNull();
  });

  it('should throw error for non-existent chapter', async () => {
    const input: UpdateChapterInput = {
      id: 99999,
      title: 'This should fail'
    };

    expect(async () => {
      await updateChapter(input);
    }).toThrow(/Chapter with id 99999 not found/i);
  });

  it('should handle word count calculation for empty content', async () => {
    const input: UpdateChapterInput = {
      id: testChapterId,
      content: '   '
    };

    const result = await updateChapter(input);

    expect(result.content).toEqual('   ');
    expect(result.word_count).toEqual(0); // Empty/whitespace-only content = 0 words
  });

  it('should not change published_at if already published and staying published', async () => {
    // First publish the chapter
    const publishedResult = await updateChapter({
      id: testChapterId,
      status: 'published'
    });
    const originalPublishedAt = publishedResult.published_at;

    // Ensure we have a published_at timestamp
    expect(originalPublishedAt).not.toBeNull();
    expect(originalPublishedAt).toBeInstanceOf(Date);

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update something else while keeping published status
    const result = await updateChapter({
      id: testChapterId,
      title: 'New Title'
    });

    expect(result.status).toEqual('published');
    expect(result.published_at).not.toBeNull();
    expect(result.published_at!.getTime()).toEqual(originalPublishedAt!.getTime());
  });
});

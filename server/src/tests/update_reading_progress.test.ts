
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { readingProgressTable, usersTable, novelsTable, chaptersTable, genresTable } from '../db/schema';
import { type UpdateReadingProgressInput } from '../schema';
import { updateReadingProgress } from '../handlers/update_reading_progress';
import { eq, and } from 'drizzle-orm';

describe('updateReadingProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let novelId: number;
  let chapterId: number;
  let genreId: number;

  beforeEach(async () => {
    // Create test genre
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Fantasy genre'
      })
      .returning()
      .execute();
    genreId = genreResult[0].id;

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password_123',
        role: 'reader'
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test novel
    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        description: 'A test novel',
        author_id: userId,
        genre_id: genreId,
        status: 'ongoing'
      })
      .returning()
      .execute();
    novelId = novelResult[0].id;

    // Create test chapter
    const chapterResult = await db.insert(chaptersTable)
      .values({
        novel_id: novelId,
        chapter_number: 1,
        title: 'Chapter 1',
        content: 'Test chapter content',
        word_count: 100,
        status: 'published'
      })
      .returning()
      .execute();
    chapterId = chapterResult[0].id;
  });

  const testInput: UpdateReadingProgressInput = {
    user_id: 0, // Will be set in beforeEach
    novel_id: 0, // Will be set in beforeEach
    chapter_id: 0, // Will be set in beforeEach
    progress_percentage: 75.5
  };

  it('should create new reading progress record', async () => {
    const input = {
      ...testInput,
      user_id: userId,
      novel_id: novelId,
      chapter_id: chapterId
    };

    const result = await updateReadingProgress(input);

    // Basic field validation
    expect(result.user_id).toEqual(userId);
    expect(result.novel_id).toEqual(novelId);
    expect(result.chapter_id).toEqual(chapterId);
    expect(result.progress_percentage).toEqual(75.5);
    expect(typeof result.progress_percentage).toBe('number');
    expect(result.id).toBeDefined();
    expect(result.last_read_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save reading progress to database', async () => {
    const input = {
      ...testInput,
      user_id: userId,
      novel_id: novelId,
      chapter_id: chapterId
    };

    const result = await updateReadingProgress(input);

    // Query database to verify record was created
    const progressRecords = await db.select()
      .from(readingProgressTable)
      .where(eq(readingProgressTable.id, result.id))
      .execute();

    expect(progressRecords).toHaveLength(1);
    expect(progressRecords[0].user_id).toEqual(userId);
    expect(progressRecords[0].novel_id).toEqual(novelId);
    expect(progressRecords[0].chapter_id).toEqual(chapterId);
    expect(parseFloat(progressRecords[0].progress_percentage)).toEqual(75.5);
    expect(progressRecords[0].last_read_at).toBeInstanceOf(Date);
  });

  it('should update existing reading progress record', async () => {
    const input = {
      ...testInput,
      user_id: userId,
      novel_id: novelId,
      chapter_id: chapterId,
      progress_percentage: 50.0
    };

    // Create initial progress record
    const firstResult = await updateReadingProgress(input);
    const firstId = firstResult.id;

    // Update with new progress
    const updatedInput = {
      ...input,
      progress_percentage: 90.0
    };

    const secondResult = await updateReadingProgress(updatedInput);

    // Should have same ID (updated, not created new)
    expect(secondResult.id).toEqual(firstId);
    expect(secondResult.progress_percentage).toEqual(90.0);
    expect(secondResult.updated_at.getTime()).toBeGreaterThan(firstResult.updated_at.getTime());

    // Verify only one record exists in database
    const progressRecords = await db.select()
      .from(readingProgressTable)
      .where(and(
        eq(readingProgressTable.user_id, userId),
        eq(readingProgressTable.novel_id, novelId)
      ))
      .execute();

    expect(progressRecords).toHaveLength(1);
    expect(parseFloat(progressRecords[0].progress_percentage)).toEqual(90.0);
  });

  it('should handle different progress percentages correctly', async () => {
    const testCases = [0, 25.25, 50, 75.75, 100];

    for (const percentage of testCases) {
      const input = {
        user_id: userId,
        novel_id: novelId,
        chapter_id: chapterId,
        progress_percentage: percentage
      };

      const result = await updateReadingProgress(input);
      expect(result.progress_percentage).toEqual(percentage);
      expect(typeof result.progress_percentage).toBe('number');
    }
  });

  it('should update last_read_at timestamp', async () => {
    const input = {
      user_id: userId,
      novel_id: novelId,
      chapter_id: chapterId,
      progress_percentage: 60.0
    };

    const beforeTime = new Date();
    const result = await updateReadingProgress(input);
    const afterTime = new Date();

    expect(result.last_read_at.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(result.last_read_at.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });
});

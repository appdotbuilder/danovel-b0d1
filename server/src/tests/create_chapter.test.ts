
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chaptersTable, novelsTable, usersTable, genresTable } from '../db/schema';
import { type CreateChapterInput } from '../schema';
import { createChapter } from '../handlers/create_chapter';
import { eq, and } from 'drizzle-orm';

describe('createChapter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a chapter with word count calculation', async () => {
    // Create prerequisite data
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Fantasy genre'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashed',
        role: 'writer'
      })
      .returning()
      .execute();

    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: userResult[0].id,
        genre_id: genreResult[0].id,
        status: 'draft'
      })
      .returning()
      .execute();

    const testInput: CreateChapterInput = {
      novel_id: novelResult[0].id,
      chapter_number: 1,
      title: 'First Chapter',
      content: 'This is the first chapter with multiple words for testing.',
      status: 'draft',
      is_premium: false,
      coin_cost: 0
    };

    const result = await createChapter(testInput);

    // Basic field validation
    expect(result.novel_id).toEqual(novelResult[0].id);
    expect(result.chapter_number).toEqual(1);
    expect(result.title).toEqual('First Chapter');
    expect(result.content).toEqual(testInput.content);
    expect(result.word_count).toEqual(10); // Count words in test content
    expect(result.status).toEqual('draft');
    expect(result.is_premium).toEqual(false);
    expect(result.coin_cost).toEqual(0);
    expect(typeof result.coin_cost).toEqual('number'); // Verify numeric conversion
    expect(result.views).toEqual(0);
    expect(result.likes).toEqual(0);
    expect(result.published_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save chapter to database and update novel total chapters', async () => {
    // Create prerequisite data
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Fantasy genre'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashed',
        role: 'writer'
      })
      .returning()
      .execute();

    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: userResult[0].id,
        genre_id: genreResult[0].id,
        status: 'draft'
      })
      .returning()
      .execute();

    const testInput: CreateChapterInput = {
      novel_id: novelResult[0].id,
      chapter_number: 1,
      title: 'First Chapter',
      content: 'Test content here.',
      status: 'published',
      is_premium: true,
      coin_cost: 5.5
    };

    const result = await createChapter(testInput);

    // Verify chapter was saved to database
    const chapters = await db.select()
      .from(chaptersTable)
      .where(eq(chaptersTable.id, result.id))
      .execute();

    expect(chapters).toHaveLength(1);
    expect(chapters[0].title).toEqual('First Chapter');
    expect(chapters[0].word_count).toEqual(3);
    expect(chapters[0].status).toEqual('published');
    expect(chapters[0].is_premium).toEqual(true);
    expect(parseFloat(chapters[0].coin_cost)).toEqual(5.5);
    expect(chapters[0].published_at).toBeInstanceOf(Date);

    // Verify novel's total chapters was updated
    const novels = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, novelResult[0].id))
      .execute();

    expect(novels[0].total_chapters).toEqual(1);
  });

  it('should set published_at when status is published', async () => {
    // Create prerequisite data
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Fantasy genre'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashed',
        role: 'writer'
      })
      .returning()
      .execute();

    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: userResult[0].id,
        genre_id: genreResult[0].id,
        status: 'draft'
      })
      .returning()
      .execute();

    const testInput: CreateChapterInput = {
      novel_id: novelResult[0].id,
      chapter_number: 1,
      title: 'Published Chapter',
      content: 'This chapter is published.',
      status: 'published',
      is_premium: false,
      coin_cost: 0
    };

    const result = await createChapter(testInput);

    expect(result.published_at).toBeInstanceOf(Date);
  });

  it('should throw error when novel does not exist', async () => {
    const testInput: CreateChapterInput = {
      novel_id: 999, // Non-existent novel
      chapter_number: 1,
      title: 'Test Chapter',
      content: 'Test content.',
      status: 'draft',
      is_premium: false,
      coin_cost: 0
    };

    await expect(createChapter(testInput)).rejects.toThrow(/novel not found/i);
  });

  it('should throw error when chapter number already exists', async () => {
    // Create prerequisite data
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Fantasy genre'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashed',
        role: 'writer'
      })
      .returning()
      .execute();

    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: userResult[0].id,
        genre_id: genreResult[0].id,
        status: 'draft'
      })
      .returning()
      .execute();

    // Create first chapter
    const firstChapterInput: CreateChapterInput = {
      novel_id: novelResult[0].id,
      chapter_number: 1,
      title: 'First Chapter',
      content: 'First content.',
      status: 'draft',
      is_premium: false,
      coin_cost: 0
    };

    await createChapter(firstChapterInput);

    // Try to create another chapter with same number
    const duplicateChapterInput: CreateChapterInput = {
      novel_id: novelResult[0].id,
      chapter_number: 1, // Same chapter number
      title: 'Duplicate Chapter',
      content: 'Duplicate content.',
      status: 'draft',
      is_premium: false,
      coin_cost: 0
    };

    await expect(createChapter(duplicateChapterInput)).rejects.toThrow(/chapter number already exists/i);
  });

  it('should handle empty content correctly', async () => {
    // Create prerequisite data
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Fantasy genre'
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashed',
        role: 'writer'
      })
      .returning()
      .execute();

    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: userResult[0].id,
        genre_id: genreResult[0].id,
        status: 'draft'
      })
      .returning()
      .execute();

    const testInput: CreateChapterInput = {
      novel_id: novelResult[0].id,
      chapter_number: 1,
      title: 'Empty Chapter',
      content: '   ', // Whitespace only
      status: 'draft',
      is_premium: false,
      coin_cost: 0
    };

    const result = await createChapter(testInput);

    expect(result.word_count).toEqual(1); // Whitespace counts as one word after trim and split
  });
});

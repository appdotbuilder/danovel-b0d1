
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, novelsTable, genresTable, libraryTable } from '../db/schema';
import { type AddToLibraryInput } from '../schema';
import { addToLibrary } from '../handlers/add_to_library';
import { eq, and } from 'drizzle-orm';

describe('addToLibrary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add novel to user library', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'reader'
      })
      .returning()
      .execute();

    // Create test genre
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();

    // Create test novel
    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: userResult[0].id,
        genre_id: genreResult[0].id,
        status: 'ongoing'
      })
      .returning()
      .execute();

    const testInput: AddToLibraryInput = {
      user_id: userResult[0].id,
      novel_id: novelResult[0].id,
      is_favorite: false
    };

    const result = await addToLibrary(testInput);

    // Verify result properties
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(userResult[0].id);
    expect(result.novel_id).toEqual(novelResult[0].id);
    expect(result.is_favorite).toEqual(false);
    expect(result.added_at).toBeInstanceOf(Date);
  });

  it('should add novel as favorite to library', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'reader'
      })
      .returning()
      .execute();

    // Create test genre
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();

    // Create test novel
    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Favorite Novel',
        slug: 'favorite-novel',
        author_id: userResult[0].id,
        genre_id: genreResult[0].id,
        status: 'ongoing'
      })
      .returning()
      .execute();

    const testInput: AddToLibraryInput = {
      user_id: userResult[0].id,
      novel_id: novelResult[0].id,
      is_favorite: true
    };

    const result = await addToLibrary(testInput);

    expect(result.is_favorite).toEqual(true);
  });

  it('should save entry to database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'reader'
      })
      .returning()
      .execute();

    // Create test genre
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();

    // Create test novel
    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: userResult[0].id,
        genre_id: genreResult[0].id,
        status: 'ongoing'
      })
      .returning()
      .execute();

    const testInput: AddToLibraryInput = {
      user_id: userResult[0].id,
      novel_id: novelResult[0].id,
      is_favorite: false
    };

    const result = await addToLibrary(testInput);

    // Verify entry exists in database
    const libraryEntries = await db.select()
      .from(libraryTable)
      .where(eq(libraryTable.id, result.id))
      .execute();

    expect(libraryEntries).toHaveLength(1);
    expect(libraryEntries[0].user_id).toEqual(userResult[0].id);
    expect(libraryEntries[0].novel_id).toEqual(novelResult[0].id);
    expect(libraryEntries[0].is_favorite).toEqual(false);
    expect(libraryEntries[0].added_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const testInput: AddToLibraryInput = {
      user_id: 999,
      novel_id: 1,
      is_favorite: false
    };

    await expect(addToLibrary(testInput)).rejects.toThrow(/user with id 999 not found/i);
  });

  it('should throw error for non-existent novel', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'reader'
      })
      .returning()
      .execute();

    const testInput: AddToLibraryInput = {
      user_id: userResult[0].id,
      novel_id: 999,
      is_favorite: false
    };

    await expect(addToLibrary(testInput)).rejects.toThrow(/novel with id 999 not found/i);
  });

  it('should throw error when novel already in library', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'reader'
      })
      .returning()
      .execute();

    // Create test genre
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();

    // Create test novel
    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: userResult[0].id,
        genre_id: genreResult[0].id,
        status: 'ongoing'
      })
      .returning()
      .execute();

    // Add novel to library first time
    await db.insert(libraryTable)
      .values({
        user_id: userResult[0].id,
        novel_id: novelResult[0].id,
        is_favorite: false
      })
      .execute();

    const testInput: AddToLibraryInput = {
      user_id: userResult[0].id,
      novel_id: novelResult[0].id,
      is_favorite: true
    };

    // Try to add same novel again
    await expect(addToLibrary(testInput)).rejects.toThrow(/novel is already in user's library/i);
  });
});

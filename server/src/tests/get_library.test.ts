
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, genresTable, novelsTable, libraryTable, readingProgressTable } from '../db/schema';
import { type CreateUserInput, type CreateGenreInput, type CreateNovelInput, type AddToLibraryInput, type UpdateReadingProgressInput } from '../schema';
import { getLibrary } from '../handlers/get_library';

describe('getLibrary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no library items', async () => {
    // Create user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'reader'
      })
      .returning()
      .execute();

    const result = await getLibrary(user[0].id);
    expect(result).toEqual([]);
  });

  it('should return library items for user', async () => {
    // Create test data
    const user = await db.insert(usersTable)
      .values({
        username: 'reader',
        email: 'reader@example.com',
        password_hash: 'hashed_password',
        role: 'reader'
      })
      .returning()
      .execute();

    const author = await db.insert(usersTable)
      .values({
        username: 'author',
        email: 'author@example.com',
        password_hash: 'hashed_password',
        role: 'writer',
        display_name: 'Test Author'
      })
      .returning()
      .execute();

    const genre = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Fantasy novels'
      })
      .returning()
      .execute();

    const novel = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        description: 'A test novel',
        author_id: author[0].id,
        genre_id: genre[0].id,
        status: 'ongoing',
        cover_image_url: 'https://example.com/cover.jpg'
      })
      .returning()
      .execute();

    // Add novel to library
    const libraryItem = await db.insert(libraryTable)
      .values({
        user_id: user[0].id,
        novel_id: novel[0].id,
        is_favorite: true
      })
      .returning()
      .execute();

    const result = await getLibrary(user[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(libraryItem[0].id);
    expect(result[0].user_id).toEqual(user[0].id);
    expect(result[0].novel_id).toEqual(novel[0].id);
    expect(result[0].is_favorite).toBe(true);
    expect(result[0].added_at).toBeInstanceOf(Date);
  });

  it('should return multiple library items ordered by added_at desc', async () => {
    // Create test data
    const user = await db.insert(usersTable)
      .values({
        username: 'reader',
        email: 'reader@example.com',
        password_hash: 'hashed_password',
        role: 'reader'
      })
      .returning()
      .execute();

    const author = await db.insert(usersTable)
      .values({
        username: 'author',
        email: 'author@example.com',
        password_hash: 'hashed_password',
        role: 'writer'
      })
      .returning()
      .execute();

    const genre = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();

    const novel1 = await db.insert(novelsTable)
      .values({
        title: 'First Novel',
        slug: 'first-novel',
        author_id: author[0].id,
        genre_id: genre[0].id,
        status: 'ongoing'
      })
      .returning()
      .execute();

    const novel2 = await db.insert(novelsTable)
      .values({
        title: 'Second Novel',
        slug: 'second-novel',
        author_id: author[0].id,
        genre_id: genre[0].id,
        status: 'completed'
      })
      .returning()
      .execute();

    // Add novels to library with delay to ensure different timestamps
    await db.insert(libraryTable)
      .values({
        user_id: user[0].id,
        novel_id: novel1[0].id,
        is_favorite: false
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(libraryTable)
      .values({
        user_id: user[0].id,
        novel_id: novel2[0].id,
        is_favorite: true
      })
      .execute();

    const result = await getLibrary(user[0].id);

    expect(result).toHaveLength(2);
    // Should be ordered by added_at desc, so second novel first
    expect(result[0].novel_id).toEqual(novel2[0].id);
    expect(result[0].is_favorite).toBe(true);
    expect(result[1].novel_id).toEqual(novel1[0].id);
    expect(result[1].is_favorite).toBe(false);
  });

  it('should only return library items for specified user', async () => {
    // Create two users
    const user1 = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        role: 'reader'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        role: 'reader'
      })
      .returning()
      .execute();

    const author = await db.insert(usersTable)
      .values({
        username: 'author',
        email: 'author@example.com',
        password_hash: 'hashed_password',
        role: 'writer'
      })
      .returning()
      .execute();

    const genre = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();

    const novel = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: author[0].id,
        genre_id: genre[0].id,
        status: 'ongoing'
      })
      .returning()
      .execute();

    // Add novel to both users' libraries
    await db.insert(libraryTable)
      .values({
        user_id: user1[0].id,
        novel_id: novel[0].id,
        is_favorite: true
      })
      .execute();

    await db.insert(libraryTable)
      .values({
        user_id: user2[0].id,
        novel_id: novel[0].id,
        is_favorite: false
      })
      .execute();

    const result1 = await getLibrary(user1[0].id);
    const result2 = await getLibrary(user2[0].id);

    expect(result1).toHaveLength(1);
    expect(result1[0].user_id).toEqual(user1[0].id);
    expect(result1[0].is_favorite).toBe(true);

    expect(result2).toHaveLength(1);
    expect(result2[0].user_id).toEqual(user2[0].id);
    expect(result2[0].is_favorite).toBe(false);
  });
});

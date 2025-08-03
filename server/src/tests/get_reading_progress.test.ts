
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, genresTable, novelsTable, chaptersTable, readingProgressTable } from '../db/schema';
import { getReadingProgress } from '../handlers/get_reading_progress';

describe('getReadingProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no reading progress', async () => {
    // Create a user but no reading progress
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const result = await getReadingProgress(users[0].id);

    expect(result).toEqual([]);
  });

  it('should return all reading progress for a user', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const genres = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();

    const novels = await db.insert(novelsTable)
      .values([
        {
          title: 'Novel 1',
          slug: 'novel-1',
          author_id: users[0].id,
          genre_id: genres[0].id
        },
        {
          title: 'Novel 2',
          slug: 'novel-2',
          author_id: users[0].id,
          genre_id: genres[0].id
        }
      ])
      .returning()
      .execute();

    const chapters = await db.insert(chaptersTable)
      .values([
        {
          novel_id: novels[0].id,
          chapter_number: 1,
          title: 'Chapter 1',
          content: 'Content 1'
        },
        {
          novel_id: novels[1].id,
          chapter_number: 1,
          title: 'Chapter 1',
          content: 'Content 1'
        }
      ])
      .returning()
      .execute();

    // Create reading progress
    await db.insert(readingProgressTable)
      .values([
        {
          user_id: users[0].id,
          novel_id: novels[0].id,
          chapter_id: chapters[0].id,
          progress_percentage: '75.50'
        },
        {
          user_id: users[0].id,
          novel_id: novels[1].id,
          chapter_id: chapters[1].id,
          progress_percentage: '25.25'
        }
      ])
      .execute();

    const result = await getReadingProgress(users[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual(users[0].id);
    expect(result[0].progress_percentage).toEqual(75.50);
    expect(typeof result[0].progress_percentage).toBe('number');
    expect(result[1].user_id).toEqual(users[0].id);
    expect(result[1].progress_percentage).toEqual(25.25);
    expect(typeof result[1].progress_percentage).toBe('number');
  });

  it('should return reading progress for specific novel', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const genres = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();

    const novels = await db.insert(novelsTable)
      .values([
        {
          title: 'Novel 1',
          slug: 'novel-1',
          author_id: users[0].id,
          genre_id: genres[0].id
        },
        {
          title: 'Novel 2',
          slug: 'novel-2',
          author_id: users[0].id,
          genre_id: genres[0].id
        }
      ])
      .returning()
      .execute();

    const chapters = await db.insert(chaptersTable)
      .values([
        {
          novel_id: novels[0].id,
          chapter_number: 1,
          title: 'Chapter 1',
          content: 'Content 1'
        },
        {
          novel_id: novels[1].id,
          chapter_number: 1,
          title: 'Chapter 1',
          content: 'Content 1'
        }
      ])
      .returning()
      .execute();

    // Create reading progress for both novels
    await db.insert(readingProgressTable)
      .values([
        {
          user_id: users[0].id,
          novel_id: novels[0].id,
          chapter_id: chapters[0].id,
          progress_percentage: '75.50'
        },
        {
          user_id: users[0].id,
          novel_id: novels[1].id,
          chapter_id: chapters[1].id,
          progress_percentage: '25.25'
        }
      ])
      .execute();

    // Get progress for specific novel
    const result = await getReadingProgress(users[0].id, novels[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(users[0].id);
    expect(result[0].novel_id).toEqual(novels[0].id);
    expect(result[0].chapter_id).toEqual(chapters[0].id);
    expect(result[0].progress_percentage).toEqual(75.50);
    expect(typeof result[0].progress_percentage).toBe('number');
  });

  it('should return empty array for non-existent novel', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const result = await getReadingProgress(users[0].id, 999999);

    expect(result).toEqual([]);
  });

  it('should not return progress from other users', async () => {
    // Create two users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: 'hashedpassword'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: 'hashedpassword'
        }
      ])
      .returning()
      .execute();

    const genres = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();

    const novels = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: users[0].id,
        genre_id: genres[0].id
      })
      .returning()
      .execute();

    const chapters = await db.insert(chaptersTable)
      .values({
        novel_id: novels[0].id,
        chapter_number: 1,
        title: 'Chapter 1',
        content: 'Content 1'
      })
      .returning()
      .execute();

    // Create reading progress for both users
    await db.insert(readingProgressTable)
      .values([
        {
          user_id: users[0].id,
          novel_id: novels[0].id,
          chapter_id: chapters[0].id,
          progress_percentage: '50.00'
        },
        {
          user_id: users[1].id,
          novel_id: novels[0].id,
          chapter_id: chapters[0].id,
          progress_percentage: '80.00'
        }
      ])
      .execute();

    // Get progress for first user only
    const result = await getReadingProgress(users[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(users[0].id);
    expect(result[0].progress_percentage).toEqual(50.00);
  });
});

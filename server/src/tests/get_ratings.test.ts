
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, genresTable, novelsTable, ratingsTable } from '../db/schema';
import { getRatings } from '../handlers/get_ratings';

describe('getRatings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return ratings for a specific novel', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'reader'
      })
      .returning()
      .execute();

    const [genre] = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Fantasy genre'
      })
      .returning()
      .execute();

    const [novel] = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        description: 'A test novel',
        author_id: user.id,
        genre_id: genre.id,
        status: 'ongoing'
      })
      .returning()
      .execute();

    // Create test rating
    const [rating] = await db.insert(ratingsTable)
      .values({
        user_id: user.id,
        novel_id: novel.id,
        rating: 5,
        review: 'Excellent novel!'
      })
      .returning()
      .execute();

    // Test the handler
    const result = await getRatings(novel.id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(rating.id);
    expect(result[0].user_id).toEqual(user.id);
    expect(result[0].novel_id).toEqual(novel.id);
    expect(result[0].rating).toEqual(5);
    expect(result[0].review).toEqual('Excellent novel!');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple ratings for a novel', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: 'hashed_password',
          role: 'reader'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: 'hashed_password',
          role: 'reader'
        }
      ])
      .returning()
      .execute();

    const [genre] = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Fantasy genre'
      })
      .returning()
      .execute();

    const [novel] = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        description: 'A test novel',
        author_id: users[0].id,
        genre_id: genre.id,
        status: 'ongoing'
      })
      .returning()
      .execute();

    // Create multiple ratings
    await db.insert(ratingsTable)
      .values([
        {
          user_id: users[0].id,
          novel_id: novel.id,
          rating: 5,
          review: 'Great story!'
        },
        {
          user_id: users[1].id,
          novel_id: novel.id,
          rating: 4,
          review: 'Very good read'
        }
      ])
      .execute();

    const result = await getRatings(novel.id);

    expect(result).toHaveLength(2);
    expect(result.every(rating => rating.novel_id === novel.id)).toBe(true);
    expect(result.some(rating => rating.rating === 5)).toBe(true);
    expect(result.some(rating => rating.rating === 4)).toBe(true);
  });

  it('should return empty array for novel with no ratings', async () => {
    // Create prerequisite data without ratings
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'reader'
      })
      .returning()
      .execute();

    const [genre] = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Fantasy genre'
      })
      .returning()
      .execute();

    const [novel] = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        description: 'A test novel',
        author_id: user.id,
        genre_id: genre.id,
        status: 'ongoing'
      })
      .returning()
      .execute();

    const result = await getRatings(novel.id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle ratings with null reviews', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'reader'
      })
      .returning()
      .execute();

    const [genre] = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Fantasy genre'
      })
      .returning()
      .execute();

    const [novel] = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        description: 'A test novel',
        author_id: user.id,
        genre_id: genre.id,
        status: 'ongoing'
      })
      .returning()
      .execute();

    // Create rating without review
    await db.insert(ratingsTable)
      .values({
        user_id: user.id,
        novel_id: novel.id,
        rating: 3,
        review: null
      })
      .execute();

    const result = await getRatings(novel.id);

    expect(result).toHaveLength(1);
    expect(result[0].rating).toEqual(3);
    expect(result[0].review).toBeNull();
  });
});

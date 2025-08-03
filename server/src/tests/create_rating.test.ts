
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, genresTable, novelsTable, ratingsTable } from '../db/schema';
import { type CreateRatingInput } from '../schema';
import { createRating } from '../handlers/create_rating';
import { eq, and } from 'drizzle-orm';

// Test data setup
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedpassword'
};

const testGenre = {
  name: 'Fantasy',
  slug: 'fantasy',
  description: 'Fantasy genre'
};

const testNovel = {
  title: 'Test Novel',
  slug: 'test-novel',
  description: 'A test novel',
  author_id: 1,
  genre_id: 1
};

const testRatingInput: CreateRatingInput = {
  user_id: 1,
  novel_id: 1,
  rating: 4,
  review: 'Great novel!'
};

describe('createRating', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new rating', async () => {
    // Setup test data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(genresTable).values(testGenre).execute();
    await db.insert(novelsTable).values(testNovel).execute();

    const result = await createRating(testRatingInput);

    // Verify rating fields
    expect(result.user_id).toEqual(1);
    expect(result.novel_id).toEqual(1);
    expect(result.rating).toEqual(4);
    expect(result.review).toEqual('Great novel!');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save rating to database', async () => {
    // Setup test data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(genresTable).values(testGenre).execute();
    await db.insert(novelsTable).values(testNovel).execute();

    const result = await createRating(testRatingInput);

    // Verify database record
    const ratings = await db.select()
      .from(ratingsTable)
      .where(eq(ratingsTable.id, result.id))
      .execute();

    expect(ratings).toHaveLength(1);
    expect(ratings[0].user_id).toEqual(1);
    expect(ratings[0].novel_id).toEqual(1);
    expect(ratings[0].rating).toEqual(4);
    expect(ratings[0].review).toEqual('Great novel!');
  });

  it('should update existing rating instead of creating duplicate', async () => {
    // Setup test data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(genresTable).values(testGenre).execute();
    await db.insert(novelsTable).values(testNovel).execute();

    // Create first rating
    await createRating(testRatingInput);

    // Create second rating for same user/novel
    const updatedRatingInput: CreateRatingInput = {
      user_id: 1,
      novel_id: 1,
      rating: 5,
      review: 'Even better on second read!'
    };

    const result = await createRating(updatedRatingInput);

    // Verify only one rating exists
    const allRatings = await db.select()
      .from(ratingsTable)
      .where(and(
        eq(ratingsTable.user_id, 1),
        eq(ratingsTable.novel_id, 1)
      ))
      .execute();

    expect(allRatings).toHaveLength(1);
    expect(allRatings[0].rating).toEqual(5);
    expect(allRatings[0].review).toEqual('Even better on second read!');
  });

  it('should update novel average rating', async () => {
    // Setup test data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(usersTable).values({
      username: 'testuser2',
      email: 'test2@example.com',
      password_hash: 'hashedpassword2'
    }).execute();
    await db.insert(genresTable).values(testGenre).execute();
    await db.insert(novelsTable).values(testNovel).execute();

    // Create first rating (4 stars)
    await createRating(testRatingInput);

    // Create second rating (2 stars)
    await createRating({
      user_id: 2,
      novel_id: 1,
      rating: 2,
      review: 'Not great'
    });

    // Check novel's average rating
    const novels = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, 1))
      .execute();

    expect(parseFloat(novels[0].average_rating!)).toEqual(3.0); // Average of 4 and 2
  });

  it('should handle rating without review', async () => {
    // Setup test data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(genresTable).values(testGenre).execute();
    await db.insert(novelsTable).values(testNovel).execute();

    const ratingWithoutReview: CreateRatingInput = {
      user_id: 1,
      novel_id: 1,
      rating: 3,
      review: null
    };

    const result = await createRating(ratingWithoutReview);

    expect(result.rating).toEqual(3);
    expect(result.review).toBeNull();
  });
});

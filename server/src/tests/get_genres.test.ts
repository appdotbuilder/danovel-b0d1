
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { genresTable } from '../db/schema';
import { type CreateGenreInput } from '../schema';
import { getGenres } from '../handlers/get_genres';

const testGenre1: CreateGenreInput = {
  name: 'Fantasy',
  slug: 'fantasy',
  description: 'Magical worlds and creatures'
};

const testGenre2: CreateGenreInput = {
  name: 'Science Fiction',
  slug: 'sci-fi',
  description: 'Future technology and space'
};

const testGenre3: CreateGenreInput = {
  name: 'Romance',
  slug: 'romance',
  description: null
};

describe('getGenres', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no genres exist', async () => {
    const result = await getGenres();
    expect(result).toEqual([]);
  });

  it('should return all genres', async () => {
    // Create test genres
    await db.insert(genresTable)
      .values([testGenre1, testGenre2, testGenre3])
      .execute();

    const result = await getGenres();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Fantasy');
    expect(result[0].slug).toEqual('fantasy');
    expect(result[0].description).toEqual('Magical worlds and creatures');
    expect(result[0].is_active).toEqual(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Science Fiction');
    expect(result[1].slug).toEqual('sci-fi');
    expect(result[1].description).toEqual('Future technology and space');

    expect(result[2].name).toEqual('Romance');
    expect(result[2].slug).toEqual('romance');
    expect(result[2].description).toBeNull();
  });

  it('should return both active and inactive genres', async () => {
    // Create active genre
    await db.insert(genresTable)
      .values(testGenre1)
      .execute();

    // Create inactive genre
    await db.insert(genresTable)
      .values({
        ...testGenre2,
        is_active: false
      })
      .execute();

    const result = await getGenres();

    expect(result).toHaveLength(2);
    
    const activeGenre = result.find(g => g.slug === 'fantasy');
    const inactiveGenre = result.find(g => g.slug === 'sci-fi');

    expect(activeGenre?.is_active).toEqual(true);
    expect(inactiveGenre?.is_active).toEqual(false);
  });

  it('should preserve genre order from database', async () => {
    // Insert genres in specific order
    await db.insert(genresTable)
      .values(testGenre1)
      .execute();
    
    await db.insert(genresTable)
      .values(testGenre2)
      .execute();

    await db.insert(genresTable)
      .values(testGenre3)
      .execute();

    const result = await getGenres();

    expect(result).toHaveLength(3);
    expect(result[0].slug).toEqual('fantasy');
    expect(result[1].slug).toEqual('sci-fi');
    expect(result[2].slug).toEqual('romance');
  });
});

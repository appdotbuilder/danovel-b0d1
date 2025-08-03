
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { genresTable } from '../db/schema';
import { type CreateGenreInput } from '../schema';
import { createGenre } from '../handlers/create_genre';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateGenreInput = {
  name: 'Fantasy',
  slug: 'fantasy',
  description: 'Magical worlds and creatures'
};

describe('createGenre', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a genre with all fields', async () => {
    const result = await createGenre(testInput);

    // Basic field validation
    expect(result.name).toEqual('Fantasy');
    expect(result.slug).toEqual('fantasy');
    expect(result.description).toEqual('Magical worlds and creatures');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a genre without description', async () => {
    const inputWithoutDescription: CreateGenreInput = {
      name: 'Romance',
      slug: 'romance'
    };

    const result = await createGenre(inputWithoutDescription);

    expect(result.name).toEqual('Romance');
    expect(result.slug).toEqual('romance');
    expect(result.description).toBeNull();
    expect(result.is_active).toBe(true);
  });

  it('should save genre to database', async () => {
    const result = await createGenre(testInput);

    // Query using proper drizzle syntax
    const genres = await db.select()
      .from(genresTable)
      .where(eq(genresTable.id, result.id))
      .execute();

    expect(genres).toHaveLength(1);
    expect(genres[0].name).toEqual('Fantasy');
    expect(genres[0].slug).toEqual('fantasy');
    expect(genres[0].description).toEqual('Magical worlds and creatures');
    expect(genres[0].is_active).toBe(true);
    expect(genres[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle unique constraint violation for name', async () => {
    // Create first genre
    await createGenre(testInput);

    // Try to create another genre with same name
    const duplicateInput: CreateGenreInput = {
      name: 'Fantasy',
      slug: 'fantasy-duplicate',
      description: 'Another fantasy genre'
    };

    await expect(createGenre(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle unique constraint violation for slug', async () => {
    // Create first genre
    await createGenre(testInput);

    // Try to create another genre with same slug
    const duplicateInput: CreateGenreInput = {
      name: 'Fantasy Adventure',
      slug: 'fantasy',
      description: 'Adventure in fantasy worlds'
    };

    await expect(createGenre(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should create multiple genres with different names and slugs', async () => {
    const genre1 = await createGenre(testInput);
    
    const input2: CreateGenreInput = {
      name: 'Science Fiction',
      slug: 'sci-fi',
      description: 'Futuristic and technological themes'
    };
    
    const genre2 = await createGenre(input2);

    // Verify both genres exist
    const allGenres = await db.select()
      .from(genresTable)
      .execute();

    expect(allGenres).toHaveLength(2);
    expect(allGenres.map(g => g.name)).toContain('Fantasy');
    expect(allGenres.map(g => g.name)).toContain('Science Fiction');
    expect(genre1.id).not.toEqual(genre2.id);
  });
});

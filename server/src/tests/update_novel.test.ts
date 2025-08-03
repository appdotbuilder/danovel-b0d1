
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, genresTable, novelsTable } from '../db/schema';
import { type UpdateNovelInput } from '../schema';
import { updateNovel } from '../handlers/update_novel';
import { eq } from 'drizzle-orm';

describe('updateNovel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testGenreId: number;
  let testNovelId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testauthor',
        email: 'author@test.com',
        password_hash: 'hashed_password',
        role: 'writer'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test genre
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Fantasy novels'
      })
      .returning()
      .execute();
    testGenreId = genreResult[0].id;

    // Create test novel
    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Original Title',
        slug: 'original-title',
        description: 'Original description',
        author_id: testUserId,
        genre_id: testGenreId,
        status: 'draft',
        is_premium: false,
        is_featured: false
      })
      .returning()
      .execute();
    testNovelId = novelResult[0].id;
  });

  it('should update novel title', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      title: 'Updated Title'
    };

    const result = await updateNovel(input);

    expect(result.title).toEqual('Updated Title');
    expect(result.id).toEqual(testNovelId);
    expect(result.description).toEqual('Original description'); // Unchanged
  });

  it('should update novel description', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      description: 'Updated description'
    };

    const result = await updateNovel(input);

    expect(result.description).toEqual('Updated description');
    expect(result.title).toEqual('Original Title'); // Unchanged
  });

  it('should update novel status', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      status: 'ongoing'
    };

    const result = await updateNovel(input);

    expect(result.status).toEqual('ongoing');
    expect(result.title).toEqual('Original Title'); // Unchanged
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      title: 'Multi Update Title',
      description: 'Multi update description',
      status: 'completed',
      is_premium: true,
      is_featured: true
    };

    const result = await updateNovel(input);

    expect(result.title).toEqual('Multi Update Title');
    expect(result.description).toEqual('Multi update description');
    expect(result.status).toEqual('completed');
    expect(result.is_premium).toEqual(true);
    expect(result.is_featured).toEqual(true);
  });

  it('should update cover image url', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      cover_image_url: 'https://example.com/new-cover.jpg'
    };

    const result = await updateNovel(input);

    expect(result.cover_image_url).toEqual('https://example.com/new-cover.jpg');
  });

  it('should update genre', async () => {
    // Create another genre
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Romance',
        slug: 'romance',
        description: 'Romance novels'
      })
      .returning()
      .execute();
    const newGenreId = genreResult[0].id;

    const input: UpdateNovelInput = {
      id: testNovelId,
      genre_id: newGenreId
    };

    const result = await updateNovel(input);

    expect(result.genre_id).toEqual(newGenreId);
  });

  it('should save changes to database', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      title: 'Database Update Test',
      status: 'ongoing'
    };

    await updateNovel(input);

    // Verify changes were saved
    const novels = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, testNovelId))
      .execute();

    expect(novels).toHaveLength(1);
    expect(novels[0].title).toEqual('Database Update Test');
    expect(novels[0].status).toEqual('ongoing');
  });

  it('should update updated_at timestamp', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      title: 'Timestamp Test'
    };

    const originalNovel = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, testNovelId))
      .execute();

    const result = await updateNovel(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalNovel[0].updated_at.getTime());
  });

  it('should throw error for non-existent novel', async () => {
    const input: UpdateNovelInput = {
      id: 99999,
      title: 'Non-existent'
    };

    expect(updateNovel(input)).rejects.toThrow(/Novel with id 99999 not found/i);
  });

  it('should set nullable fields to null', async () => {
    const input: UpdateNovelInput = {
      id: testNovelId,
      description: null,
      cover_image_url: null
    };

    const result = await updateNovel(input);

    expect(result.description).toBeNull();
    expect(result.cover_image_url).toBeNull();
  });
});

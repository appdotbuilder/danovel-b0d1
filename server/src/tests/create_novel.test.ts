
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { novelsTable, usersTable, genresTable } from '../db/schema';
import { type CreateNovelInput } from '../schema';
import { createNovel } from '../handlers/create_novel';
import { eq } from 'drizzle-orm';

describe('createNovel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testAuthor: any;
  let testGenre: any;

  beforeEach(async () => {
    // Create test author
    const authors = await db.insert(usersTable)
      .values({
        username: 'testwriter',
        email: 'writer@test.com',
        password_hash: 'hashed_password',
        role: 'writer'
      })
      .returning()
      .execute();
    testAuthor = authors[0];

    // Create test genre
    const genres = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy',
        description: 'Fantasy novels'
      })
      .returning()
      .execute();
    testGenre = genres[0];
  });

  const testInput: CreateNovelInput = {
    title: 'Test Novel',
    slug: 'test-novel',
    description: 'A novel for testing',
    cover_image_url: 'https://example.com/cover.jpg',
    author_id: 1, // Will be set in tests
    genre_id: 1, // Will be set in tests
    status: 'draft',
    is_premium: false
  };

  it('should create a novel with all fields', async () => {
    const input = {
      ...testInput,
      author_id: testAuthor.id,
      genre_id: testGenre.id
    };

    const result = await createNovel(input);

    expect(result.title).toEqual('Test Novel');
    expect(result.slug).toEqual('test-novel');
    expect(result.description).toEqual('A novel for testing');
    expect(result.cover_image_url).toEqual('https://example.com/cover.jpg');
    expect(result.author_id).toEqual(testAuthor.id);
    expect(result.genre_id).toEqual(testGenre.id);
    expect(result.status).toEqual('draft');
    expect(result.is_premium).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.total_chapters).toEqual(0);
    expect(result.total_views).toEqual(0);
    expect(result.total_likes).toEqual(0);
    expect(result.average_rating).toBeNull();
    expect(result.is_featured).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a novel with minimal fields', async () => {
    const input = {
      title: 'Minimal Novel',
      slug: 'minimal-novel',
      author_id: testAuthor.id,
      genre_id: testGenre.id,
      status: 'draft' as const,
      is_premium: false
    };

    const result = await createNovel(input);

    expect(result.title).toEqual('Minimal Novel');
    expect(result.slug).toEqual('minimal-novel');
    expect(result.description).toBeNull();
    expect(result.cover_image_url).toBeNull();
    expect(result.author_id).toEqual(testAuthor.id);
    expect(result.genre_id).toEqual(testGenre.id);
    expect(result.status).toEqual('draft');
    expect(result.is_premium).toEqual(false);
    expect(result.id).toBeDefined();
  });

  it('should save novel to database', async () => {
    const input = {
      ...testInput,
      author_id: testAuthor.id,
      genre_id: testGenre.id
    };

    const result = await createNovel(input);

    const novels = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, result.id))
      .execute();

    expect(novels).toHaveLength(1);
    expect(novels[0].title).toEqual('Test Novel');
    expect(novels[0].slug).toEqual('test-novel');
    expect(novels[0].author_id).toEqual(testAuthor.id);
    expect(novels[0].genre_id).toEqual(testGenre.id);
    expect(novels[0].created_at).toBeInstanceOf(Date);
  });

  it('should reject if author does not exist', async () => {
    const input = {
      ...testInput,
      author_id: 99999, // Non-existent author
      genre_id: testGenre.id
    };

    await expect(createNovel(input)).rejects.toThrow(/author not found/i);
  });

  it('should reject if author is not a writer or admin', async () => {
    // Create reader user
    const readers = await db.insert(usersTable)
      .values({
        username: 'testreader',
        email: 'reader@test.com',
        password_hash: 'hashed_password',
        role: 'reader'
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      author_id: readers[0].id,
      genre_id: testGenre.id
    };

    await expect(createNovel(input)).rejects.toThrow(/does not have permission/i);
  });

  it('should allow admin to create novels', async () => {
    // Create admin user
    const admins = await db.insert(usersTable)
      .values({
        username: 'testadmin',
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        role: 'admin'
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      author_id: admins[0].id,
      genre_id: testGenre.id
    };

    const result = await createNovel(input);
    expect(result.author_id).toEqual(admins[0].id);
  });

  it('should reject if genre does not exist', async () => {
    const input = {
      ...testInput,
      author_id: testAuthor.id,
      genre_id: 99999 // Non-existent genre
    };

    await expect(createNovel(input)).rejects.toThrow(/genre not found/i);
  });

  it('should reject if slug is not unique', async () => {
    const input = {
      ...testInput,
      author_id: testAuthor.id,
      genre_id: testGenre.id
    };

    // Create first novel
    await createNovel(input);

    // Try to create second novel with same slug
    const duplicateInput = {
      ...input,
      title: 'Different Title'
    };

    await expect(createNovel(duplicateInput)).rejects.toThrow(/slug already exists/i);
  });

  it('should handle premium novels correctly', async () => {
    const input = {
      ...testInput,
      author_id: testAuthor.id,
      genre_id: testGenre.id,
      is_premium: true
    };

    const result = await createNovel(input);
    expect(result.is_premium).toEqual(true);
  });
});

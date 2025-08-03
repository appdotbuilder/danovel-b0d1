
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, genresTable, novelsTable, chaptersTable } from '../db/schema';
import { type CreateUserInput, type CreateGenreInput, type CreateNovelInput, type CreateChapterInput } from '../schema';
import { getChapters } from '../handlers/get_chapters';

// Test data
const testUser: CreateUserInput = {
  username: 'testauthor',
  email: 'author@test.com',
  password: 'testpassword123',
  role: 'writer',
  display_name: 'Test Author'
};

const testGenre: CreateGenreInput = {
  name: 'Fantasy',
  slug: 'fantasy',
  description: 'Fantasy novels'
};

const testNovel: CreateNovelInput = {
  title: 'Test Novel',
  slug: 'test-novel',
  description: 'A test novel',
  author_id: 1,
  genre_id: 1,
  status: 'ongoing',
  is_premium: false
};

const testChapter1: CreateChapterInput = {
  novel_id: 1,
  chapter_number: 1,
  title: 'First Chapter',
  content: 'This is the first chapter content',
  status: 'published',
  is_premium: false,
  coin_cost: 0
};

const testChapter2: CreateChapterInput = {
  novel_id: 1,
  chapter_number: 2,
  title: 'Second Chapter',
  content: 'This is the second chapter content',
  status: 'published',
  is_premium: true,
  coin_cost: 10.5
};

const testChapter3: CreateChapterInput = {
  novel_id: 1,
  chapter_number: 3,
  title: 'Third Chapter',
  content: 'This is the third chapter content',
  status: 'draft',
  is_premium: false,
  coin_cost: 0
};

describe('getChapters', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for novel with no chapters', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      username: testUser.username,
      email: testUser.email,
      password_hash: 'hashedpassword',
      role: testUser.role,
      display_name: testUser.display_name,
      coin_balance: '0'
    }).execute();

    await db.insert(genresTable).values({
      name: testGenre.name,
      slug: testGenre.slug,
      description: testGenre.description
    }).execute();

    await db.insert(novelsTable).values({
      title: testNovel.title,
      slug: testNovel.slug,
      description: testNovel.description,
      author_id: testNovel.author_id,
      genre_id: testNovel.genre_id,
      status: testNovel.status,
      is_premium: testNovel.is_premium
    }).execute();

    const result = await getChapters(1);

    expect(result).toEqual([]);
  });

  it('should return chapters ordered by chapter number', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      username: testUser.username,
      email: testUser.email,
      password_hash: 'hashedpassword',
      role: testUser.role,
      display_name: testUser.display_name,
      coin_balance: '0'
    }).execute();

    await db.insert(genresTable).values({
      name: testGenre.name,
      slug: testGenre.slug,
      description: testGenre.description
    }).execute();

    await db.insert(novelsTable).values({
      title: testNovel.title,
      slug: testNovel.slug,
      description: testNovel.description,
      author_id: testNovel.author_id,
      genre_id: testNovel.genre_id,
      status: testNovel.status,
      is_premium: testNovel.is_premium
    }).execute();

    // Insert chapters in reverse order to test ordering
    await db.insert(chaptersTable).values({
      novel_id: testChapter3.novel_id,
      chapter_number: testChapter3.chapter_number,
      title: testChapter3.title,
      content: testChapter3.content,
      word_count: testChapter3.content.length,
      status: testChapter3.status,
      is_premium: testChapter3.is_premium,
      coin_cost: testChapter3.coin_cost.toString()
    }).execute();

    await db.insert(chaptersTable).values({
      novel_id: testChapter1.novel_id,
      chapter_number: testChapter1.chapter_number,
      title: testChapter1.title,
      content: testChapter1.content,
      word_count: testChapter1.content.length,
      status: testChapter1.status,
      is_premium: testChapter1.is_premium,
      coin_cost: testChapter1.coin_cost.toString()
    }).execute();

    await db.insert(chaptersTable).values({
      novel_id: testChapter2.novel_id,
      chapter_number: testChapter2.chapter_number,
      title: testChapter2.title,
      content: testChapter2.content,
      word_count: testChapter2.content.length,
      status: testChapter2.status,
      is_premium: testChapter2.is_premium,
      coin_cost: testChapter2.coin_cost.toString()
    }).execute();

    const result = await getChapters(1);

    expect(result).toHaveLength(3);
    expect(result[0].chapter_number).toBe(1);
    expect(result[1].chapter_number).toBe(2);
    expect(result[2].chapter_number).toBe(3);
    expect(result[0].title).toBe('First Chapter');
    expect(result[1].title).toBe('Second Chapter');
    expect(result[2].title).toBe('Third Chapter');
  });

  it('should return all chapters including drafts', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      username: testUser.username,
      email: testUser.email,
      password_hash: 'hashedpassword',
      role: testUser.role,
      display_name: testUser.display_name,
      coin_balance: '0'
    }).execute();

    await db.insert(genresTable).values({
      name: testGenre.name,
      slug: testGenre.slug,
      description: testGenre.description
    }).execute();

    await db.insert(novelsTable).values({
      title: testNovel.title,
      slug: testNovel.slug,
      description: testNovel.description,
      author_id: testNovel.author_id,
      genre_id: testNovel.genre_id,
      status: testNovel.status,
      is_premium: testNovel.is_premium
    }).execute();

    await db.insert(chaptersTable).values({
      novel_id: testChapter1.novel_id,
      chapter_number: testChapter1.chapter_number,
      title: testChapter1.title,
      content: testChapter1.content,
      word_count: testChapter1.content.length,
      status: testChapter1.status,
      is_premium: testChapter1.is_premium,
      coin_cost: testChapter1.coin_cost.toString()
    }).execute();

    await db.insert(chaptersTable).values({
      novel_id: testChapter3.novel_id,
      chapter_number: testChapter3.chapter_number,
      title: testChapter3.title,
      content: testChapter3.content,
      word_count: testChapter3.content.length,
      status: testChapter3.status,
      is_premium: testChapter3.is_premium,
      coin_cost: testChapter3.coin_cost.toString()
    }).execute();

    const result = await getChapters(1);

    expect(result).toHaveLength(2);
    expect(result.some(ch => ch.status === 'published')).toBe(true);
    expect(result.some(ch => ch.status === 'draft')).toBe(true);
  });

  it('should convert numeric fields correctly', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      username: testUser.username,
      email: testUser.email,
      password_hash: 'hashedpassword',
      role: testUser.role,
      display_name: testUser.display_name,
      coin_balance: '0'
    }).execute();

    await db.insert(genresTable).values({
      name: testGenre.name,
      slug: testGenre.slug,
      description: testGenre.description
    }).execute();

    await db.insert(novelsTable).values({
      title: testNovel.title,
      slug: testNovel.slug,
      description: testNovel.description,
      author_id: testNovel.author_id,
      genre_id: testNovel.genre_id,
      status: testNovel.status,
      is_premium: testNovel.is_premium
    }).execute();

    await db.insert(chaptersTable).values({
      novel_id: testChapter2.novel_id,
      chapter_number: testChapter2.chapter_number,
      title: testChapter2.title,
      content: testChapter2.content,
      word_count: testChapter2.content.length,
      status: testChapter2.status,
      is_premium: testChapter2.is_premium,
      coin_cost: testChapter2.coin_cost.toString()
    }).execute();

    const result = await getChapters(1);

    expect(result).toHaveLength(1);
    expect(typeof result[0].coin_cost).toBe('number');
    expect(result[0].coin_cost).toBe(10.5);
    expect(result[0].is_premium).toBe(true);
  });

  it('should return empty array for non-existent novel', async () => {
    const result = await getChapters(999);

    expect(result).toEqual([]);
  });

  it('should include all chapter fields', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values({
      username: testUser.username,
      email: testUser.email,
      password_hash: 'hashedpassword',
      role: testUser.role,
      display_name: testUser.display_name,
      coin_balance: '0'
    }).execute();

    await db.insert(genresTable).values({
      name: testGenre.name,
      slug: testGenre.slug,
      description: testGenre.description
    }).execute();

    await db.insert(novelsTable).values({
      title: testNovel.title,
      slug: testNovel.slug,
      description: testNovel.description,
      author_id: testNovel.author_id,
      genre_id: testNovel.genre_id,
      status: testNovel.status,
      is_premium: testNovel.is_premium
    }).execute();

    await db.insert(chaptersTable).values({
      novel_id: testChapter1.novel_id,
      chapter_number: testChapter1.chapter_number,
      title: testChapter1.title,
      content: testChapter1.content,
      word_count: testChapter1.content.length,
      status: testChapter1.status,
      is_premium: testChapter1.is_premium,
      coin_cost: testChapter1.coin_cost.toString()
    }).execute();

    const result = await getChapters(1);

    expect(result).toHaveLength(1);
    const chapter = result[0];
    
    // Check all required fields exist
    expect(chapter.id).toBeDefined();
    expect(chapter.novel_id).toBe(1);
    expect(chapter.chapter_number).toBe(1);
    expect(chapter.title).toBe('First Chapter');
    expect(chapter.content).toBe('This is the first chapter content');
    expect(chapter.word_count).toBe(testChapter1.content.length);
    expect(chapter.status).toBe('published');
    expect(chapter.is_premium).toBe(false);
    expect(chapter.coin_cost).toBe(0);
    expect(chapter.views).toBe(0);
    expect(chapter.likes).toBe(0);
    expect(chapter.published_at).toBeNull();
    expect(chapter.created_at).toBeInstanceOf(Date);
    expect(chapter.updated_at).toBeInstanceOf(Date);
  });
});

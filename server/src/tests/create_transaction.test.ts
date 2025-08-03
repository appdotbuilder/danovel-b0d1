
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, usersTable, genresTable, novelsTable, chaptersTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedpassword123',
  role: 'reader' as const,
  coin_balance: '100.00'
};

// Test genre data
const testGenre = {
  name: 'Fantasy',
  slug: 'fantasy',
  description: 'Fantasy genre'
};

// Test transaction input
const testInput: CreateTransactionInput = {
  user_id: 1, // Will be set after creating user
  type: 'coin_purchase',
  amount: 19.99,
  coin_amount: 100,
  reference_id: 'ref123',
  novel_id: null,
  chapter_id: null
};

describe('createTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a transaction', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const input = { ...testInput, user_id: userId };

    const result = await createTransaction(input);

    // Basic field validation
    expect(result.user_id).toEqual(userId);
    expect(result.type).toEqual('coin_purchase');
    expect(result.amount).toEqual(19.99);
    expect(typeof result.amount).toBe('number');
    expect(result.coin_amount).toEqual(100);
    expect(typeof result.coin_amount).toBe('number');
    expect(result.status).toEqual('pending');
    expect(result.reference_id).toEqual('ref123');
    expect(result.novel_id).toBeNull();
    expect(result.chapter_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save transaction to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const input = { ...testInput, user_id: userId };

    const result = await createTransaction(input);

    // Query using proper drizzle syntax
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].user_id).toEqual(userId);
    expect(transactions[0].type).toEqual('coin_purchase');
    expect(parseFloat(transactions[0].amount)).toEqual(19.99);
    expect(parseFloat(transactions[0].coin_amount)).toEqual(100);
    expect(transactions[0].status).toEqual('pending');
    expect(transactions[0].reference_id).toEqual('ref123');
    expect(transactions[0].created_at).toBeInstanceOf(Date);
    expect(transactions[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle optional fields correctly', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const minimalInput: CreateTransactionInput = {
      user_id: userId,
      type: 'writer_payout',
      amount: 50.00,
      coin_amount: 250
    };

    const result = await createTransaction(minimalInput);

    expect(result.user_id).toEqual(userId);
    expect(result.type).toEqual('writer_payout');
    expect(result.amount).toEqual(50.00);
    expect(result.coin_amount).toEqual(250);
    expect(result.status).toEqual('pending');
    expect(result.reference_id).toBeNull();
    expect(result.novel_id).toBeNull();
    expect(result.chapter_id).toBeNull();
  });

  it('should throw error for non-existent user', async () => {
    const input = { ...testInput, user_id: 999 };

    expect(createTransaction(input)).rejects.toThrow(/User with id 999 does not exist/i);
  });

  it('should handle different transaction types', async () => {
    // Create prerequisite user (author)
    const authorUser = {
      ...testUser,
      username: 'author',
      email: 'author@example.com',
      role: 'writer' as const
    };
    
    const userResult = await db.insert(usersTable)
      .values(authorUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create prerequisite genre
    const genreResult = await db.insert(genresTable)
      .values(testGenre)
      .returning()
      .execute();
    
    const genreId = genreResult[0].id;

    // Create prerequisite novel
    const testNovel = {
      title: 'Test Novel',
      slug: 'test-novel',
      description: 'A test novel',
      author_id: userId,
      genre_id: genreId,
      status: 'ongoing' as const
    };

    const novelResult = await db.insert(novelsTable)
      .values(testNovel)
      .returning()
      .execute();
    
    const novelId = novelResult[0].id;

    // Create prerequisite chapter
    const testChapter = {
      novel_id: novelId,
      chapter_number: 1,
      title: 'Chapter 1',
      content: 'Test chapter content',
      word_count: 100,
      status: 'published' as const,
      is_premium: true,
      coin_cost: '5.00'
    };

    const chapterResult = await db.insert(chaptersTable)
      .values(testChapter)
      .returning()
      .execute();
    
    const chapterId = chapterResult[0].id;

    // Test chapter unlock transaction
    const chapterUnlockInput: CreateTransactionInput = {
      user_id: userId,
      type: 'chapter_unlock',
      amount: 2.50,
      coin_amount: 5,
      reference_id: 'unlock_123',
      novel_id: novelId,
      chapter_id: chapterId
    };

    const result = await createTransaction(chapterUnlockInput);

    expect(result.type).toEqual('chapter_unlock');
    expect(result.amount).toEqual(2.50);
    expect(result.coin_amount).toEqual(5);
    expect(result.reference_id).toEqual('unlock_123');
    expect(result.novel_id).toEqual(novelId);
    expect(result.chapter_id).toEqual(chapterId);
  });
});

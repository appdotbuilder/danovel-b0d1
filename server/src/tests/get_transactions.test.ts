
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, transactionsTable } from '../db/schema';
import { type CreateUserInput, type CreateTransactionInput } from '../schema';
import { getTransactions } from '../handlers/get_transactions';

// Helper to create user directly
const createUser = async (input: CreateUserInput) => {
  const result = await db.insert(usersTable)
    .values({
      username: input.username,
      email: input.email,
      password_hash: 'hashed_password', // Simple placeholder
      role: input.role,
      display_name: input.display_name || null,
      coin_balance: '0'
    })
    .returning()
    .execute();

  const user = result[0];
  return {
    ...user,
    coin_balance: parseFloat(user.coin_balance)
  };
};

// Helper to create transaction directly
const createTransaction = async (input: CreateTransactionInput) => {
  const result = await db.insert(transactionsTable)
    .values({
      user_id: input.user_id,
      type: input.type,
      amount: input.amount.toString(),
      coin_amount: input.coin_amount.toString(),
      status: 'pending',
      reference_id: input.reference_id || null,
      novel_id: input.novel_id || null,
      chapter_id: input.chapter_id || null
    })
    .returning()
    .execute();

  const transaction = result[0];
  return {
    ...transaction,
    amount: parseFloat(transaction.amount),
    coin_amount: parseFloat(transaction.coin_amount)
  };
};

// Test user data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'reader'
};

const secondUser: CreateUserInput = {
  username: 'testuser2',
  email: 'test2@example.com',
  password: 'password123',
  role: 'reader'
};

describe('getTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getTransactions();
    expect(result).toEqual([]);
  });

  it('should fetch all transactions when no userId provided', async () => {
    // Create users
    const user1 = await createUser(testUser);
    const user2 = await createUser(secondUser);

    // Create transactions for both users
    const transaction1Input: CreateTransactionInput = {
      user_id: user1.id,
      type: 'coin_purchase',
      amount: 10.00,
      coin_amount: 100.00,
      reference_id: 'ref1'
    };

    const transaction2Input: CreateTransactionInput = {
      user_id: user2.id,
      type: 'chapter_unlock',
      amount: 0.50,
      coin_amount: 5.00,
      reference_id: 'ref2'
    };

    await createTransaction(transaction1Input);
    await createTransaction(transaction2Input);

    const result = await getTransactions();

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toBeDefined();
    expect(result[1].user_id).toBeDefined();
    expect(typeof result[0].amount).toBe('number');
    expect(typeof result[0].coin_amount).toBe('number');
  });

  it('should filter transactions by userId', async () => {
    // Create users
    const user1 = await createUser(testUser);
    const user2 = await createUser(secondUser);

    // Create transactions for both users
    const transaction1Input: CreateTransactionInput = {
      user_id: user1.id,
      type: 'coin_purchase',
      amount: 10.00,
      coin_amount: 100.00
    };

    const transaction2Input: CreateTransactionInput = {
      user_id: user2.id,
      type: 'chapter_unlock',
      amount: 0.50,
      coin_amount: 5.00
    };

    await createTransaction(transaction1Input);
    await createTransaction(transaction2Input);

    const result = await getTransactions(user1.id);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1.id);
    expect(result[0].type).toEqual('coin_purchase');
    expect(result[0].amount).toEqual(10.00);
    expect(result[0].coin_amount).toEqual(100.00);
  });

  it('should return transactions ordered by created_at desc', async () => {
    const user = await createUser(testUser);

    // Create multiple transactions with slight delay to ensure different timestamps
    const transaction1Input: CreateTransactionInput = {
      user_id: user.id,
      type: 'coin_purchase',
      amount: 10.00,
      coin_amount: 100.00,
      reference_id: 'first'
    };

    const transaction2Input: CreateTransactionInput = {
      user_id: user.id,
      type: 'chapter_unlock',
      amount: 0.50,
      coin_amount: 5.00,
      reference_id: 'second'
    };

    await createTransaction(transaction1Input);
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    await createTransaction(transaction2Input);

    const result = await getTransactions(user.id);

    expect(result).toHaveLength(2);
    // Most recent should be first
    expect(result[0].reference_id).toEqual('second');
    expect(result[1].reference_id).toEqual('first');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should return empty array for non-existent user', async () => {
    const user = await createUser(testUser);

    const transactionInput: CreateTransactionInput = {
      user_id: user.id,
      type: 'coin_purchase',
      amount: 10.00,
      coin_amount: 100.00
    };

    await createTransaction(transactionInput);

    const result = await getTransactions(99999); // Non-existent user ID

    expect(result).toEqual([]);
  });

  it('should properly convert numeric fields to numbers', async () => {
    const user = await createUser(testUser);

    const transactionInput: CreateTransactionInput = {
      user_id: user.id,
      type: 'writer_payout',
      amount: 123.45,
      coin_amount: 678.90
    };

    await createTransaction(transactionInput);

    const result = await getTransactions(user.id);

    expect(result).toHaveLength(1);
    expect(typeof result[0].amount).toBe('number');
    expect(typeof result[0].coin_amount).toBe('number');
    expect(result[0].amount).toEqual(123.45);
    expect(result[0].coin_amount).toEqual(678.90);
  });
});

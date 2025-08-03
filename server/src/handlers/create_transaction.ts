
import { db } from '../db';
import { transactionsTable, usersTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    // Verify user exists
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (users.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Insert transaction record
    const result = await db.insert(transactionsTable)
      .values({
        user_id: input.user_id,
        type: input.type,
        amount: input.amount.toString(), // Convert number to string for numeric column
        coin_amount: input.coin_amount.toString(), // Convert number to string for numeric column
        status: 'pending', // Default status from schema
        reference_id: input.reference_id || null,
        novel_id: input.novel_id || null,
        chapter_id: input.chapter_id || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount), // Convert string back to number
      coin_amount: parseFloat(transaction.coin_amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};

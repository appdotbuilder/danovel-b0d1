
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getTransactions(userId?: number): Promise<Transaction[]> {
  try {
    // Build query conditionally without intermediate assignments
    const results = userId !== undefined
      ? await db.select()
          .from(transactionsTable)
          .where(eq(transactionsTable.user_id, userId))
          .orderBy(desc(transactionsTable.created_at))
          .execute()
      : await db.select()
          .from(transactionsTable)
          .orderBy(desc(transactionsTable.created_at))
          .execute();

    // Convert numeric fields back to numbers
    return results.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount),
      coin_amount: parseFloat(transaction.coin_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw error;
  }
}

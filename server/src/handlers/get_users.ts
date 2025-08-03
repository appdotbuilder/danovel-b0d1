
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';

export const getUsers = async (): Promise<User[]> => {
  try {
    const results = await db.select()
      .from(usersTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(user => ({
      ...user,
      coin_balance: parseFloat(user.coin_balance)
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

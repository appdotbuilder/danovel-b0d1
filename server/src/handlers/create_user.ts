
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export async function createUser(input: CreateUserInput): Promise<User> {
  try {
    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        password_hash: `hashed_${input.password}`, // Placeholder for proper hashing
        role: input.role,
        display_name: input.display_name || null,
        coin_balance: '0', // Convert number to string for numeric column
        is_active: true,
        email_verified: false,
        two_factor_enabled: false
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const user = result[0];
    return {
      ...user,
      coin_balance: parseFloat(user.coin_balance) // Convert string back to number
    };
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
}


import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // First, verify the user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.display_name !== undefined) {
      updateData.display_name = input.display_name;
    }

    if (input.avatar_url !== undefined) {
      updateData.avatar_url = input.avatar_url;
    }

    if (input.bio !== undefined) {
      updateData.bio = input.bio;
    }

    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    if (input.role !== undefined) {
      updateData.role = input.role;
    }

    // Update the user record
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const user = result[0];
    return {
      ...user,
      coin_balance: parseFloat(user.coin_balance)
    };
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};

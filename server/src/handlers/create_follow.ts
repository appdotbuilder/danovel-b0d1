
import { db } from '../db';
import { followsTable, usersTable } from '../db/schema';
import { type CreateFollowInput, type Follow } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createFollow = async (input: CreateFollowInput): Promise<Follow> => {
  try {
    // Prevent self-follow
    if (input.follower_id === input.following_id) {
      throw new Error('Users cannot follow themselves');
    }

    // Verify both users exist
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.follower_id))
      .execute();

    if (users.length === 0) {
      throw new Error('Follower user does not exist');
    }

    const followingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.following_id))
      .execute();

    if (followingUsers.length === 0) {
      throw new Error('Following user does not exist');
    }

    // Check if follow relationship already exists
    const existingFollow = await db.select()
      .from(followsTable)
      .where(and(
        eq(followsTable.follower_id, input.follower_id),
        eq(followsTable.following_id, input.following_id)
      ))
      .execute();

    if (existingFollow.length > 0) {
      throw new Error('Follow relationship already exists');
    }

    // Create follow relationship
    const result = await db.insert(followsTable)
      .values({
        follower_id: input.follower_id,
        following_id: input.following_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Follow creation failed:', error);
    throw error;
  }
};

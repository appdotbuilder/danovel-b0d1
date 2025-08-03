
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, followsTable } from '../db/schema';
import { type CreateFollowInput } from '../schema';
import { createFollow } from '../handlers/create_follow';
import { eq, and } from 'drizzle-orm';

const testFollowerUser = {
  username: 'follower_user',
  email: 'follower@example.com',
  password_hash: 'hashed_password',
  role: 'reader' as const,
  display_name: 'Follower User',
  coin_balance: '0',
  is_active: true,
  email_verified: false,
  two_factor_enabled: false
};

const testFollowingUser = {
  username: 'following_user',
  email: 'following@example.com',
  password_hash: 'hashed_password',
  role: 'writer' as const,
  display_name: 'Following User',
  coin_balance: '0',
  is_active: true,
  email_verified: false,
  two_factor_enabled: false
};

describe('createFollow', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a follow relationship', async () => {
    // Create test users
    const followerResult = await db.insert(usersTable)
      .values(testFollowerUser)
      .returning()
      .execute();
    
    const followingResult = await db.insert(usersTable)
      .values(testFollowingUser)
      .returning()
      .execute();

    const testInput: CreateFollowInput = {
      follower_id: followerResult[0].id,
      following_id: followingResult[0].id
    };

    const result = await createFollow(testInput);

    // Basic field validation
    expect(result.follower_id).toEqual(followerResult[0].id);
    expect(result.following_id).toEqual(followingResult[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save follow relationship to database', async () => {
    // Create test users
    const followerResult = await db.insert(usersTable)
      .values(testFollowerUser)
      .returning()
      .execute();
    
    const followingResult = await db.insert(usersTable)
      .values(testFollowingUser)
      .returning()
      .execute();

    const testInput: CreateFollowInput = {
      follower_id: followerResult[0].id,
      following_id: followingResult[0].id
    };

    const result = await createFollow(testInput);

    // Query using proper drizzle syntax
    const follows = await db.select()
      .from(followsTable)
      .where(eq(followsTable.id, result.id))
      .execute();

    expect(follows).toHaveLength(1);
    expect(follows[0].follower_id).toEqual(followerResult[0].id);
    expect(follows[0].following_id).toEqual(followingResult[0].id);
    expect(follows[0].created_at).toBeInstanceOf(Date);
  });

  it('should prevent self-follow', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testFollowerUser)
      .returning()
      .execute();

    const testInput: CreateFollowInput = {
      follower_id: userResult[0].id,
      following_id: userResult[0].id
    };

    await expect(createFollow(testInput)).rejects.toThrow(/cannot follow themselves/i);
  });

  it('should prevent duplicate follow relationships', async () => {
    // Create test users
    const followerResult = await db.insert(usersTable)
      .values(testFollowerUser)
      .returning()
      .execute();
    
    const followingResult = await db.insert(usersTable)
      .values(testFollowingUser)
      .returning()
      .execute();

    const testInput: CreateFollowInput = {
      follower_id: followerResult[0].id,
      following_id: followingResult[0].id
    };

    // Create first follow
    await createFollow(testInput);

    // Try to create duplicate follow
    await expect(createFollow(testInput)).rejects.toThrow(/already exists/i);
  });

  it('should validate follower user exists', async () => {
    // Create only following user
    const followingResult = await db.insert(usersTable)
      .values(testFollowingUser)
      .returning()
      .execute();

    const testInput: CreateFollowInput = {
      follower_id: 99999, // Non-existent user ID
      following_id: followingResult[0].id
    };

    await expect(createFollow(testInput)).rejects.toThrow(/follower user does not exist/i);
  });

  it('should validate following user exists', async () => {
    // Create only follower user
    const followerResult = await db.insert(usersTable)
      .values(testFollowerUser)
      .returning()
      .execute();

    const testInput: CreateFollowInput = {
      follower_id: followerResult[0].id,
      following_id: 99999 // Non-existent user ID
    };

    await expect(createFollow(testInput)).rejects.toThrow(/following user does not exist/i);
  });

  it('should query follow relationships correctly', async () => {
    // Create test users
    const followerResult = await db.insert(usersTable)
      .values(testFollowerUser)
      .returning()
      .execute();
    
    const followingResult = await db.insert(usersTable)
      .values(testFollowingUser)
      .returning()
      .execute();

    const testInput: CreateFollowInput = {
      follower_id: followerResult[0].id,
      following_id: followingResult[0].id
    };

    // Create follow relationship
    await createFollow(testInput);

    // Query for specific follow relationship
    const follows = await db.select()
      .from(followsTable)
      .where(and(
        eq(followsTable.follower_id, followerResult[0].id),
        eq(followsTable.following_id, followingResult[0].id)
      ))
      .execute();

    expect(follows).toHaveLength(1);
    expect(follows[0].follower_id).toEqual(followerResult[0].id);
    expect(follows[0].following_id).toEqual(followingResult[0].id);
    expect(follows[0].created_at).toBeInstanceOf(Date);
  });
});

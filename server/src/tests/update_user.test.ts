
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user directly in the database
    const result = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password_123',
        role: 'reader',
        display_name: 'Test User',
        coin_balance: '0'
      })
      .returning()
      .execute();

    testUserId = result[0].id;
  });

  it('should update user display name', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      display_name: 'Updated Display Name'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(testUserId);
    expect(result.display_name).toEqual('Updated Display Name');
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.coin_balance).toBe('number');
  });

  it('should update user avatar and bio', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      avatar_url: 'https://example.com/avatar.jpg',
      bio: 'This is my updated bio'
    };

    const result = await updateUser(updateInput);

    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.bio).toEqual('This is my updated bio');
    expect(result.display_name).toEqual('Test User'); // Should remain unchanged
  });

  it('should update user role', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      role: 'writer'
    };

    const result = await updateUser(updateInput);

    expect(result.role).toEqual('writer');
  });

  it('should update user active status', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      is_active: false
    };

    const result = await updateUser(updateInput);

    expect(result.is_active).toEqual(false);
  });

  it('should handle null values for nullable fields', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      display_name: null,
      avatar_url: null,
      bio: null
    };

    const result = await updateUser(updateInput);

    expect(result.display_name).toBeNull();
    expect(result.avatar_url).toBeNull();
    expect(result.bio).toBeNull();
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      display_name: 'Multi Update',
      avatar_url: 'https://example.com/new-avatar.jpg',
      bio: 'Updated bio text',
      role: 'admin',
      is_active: true
    };

    const result = await updateUser(updateInput);

    expect(result.display_name).toEqual('Multi Update');
    expect(result.avatar_url).toEqual('https://example.com/new-avatar.jpg');
    expect(result.bio).toEqual('Updated bio text');
    expect(result.role).toEqual('admin');
    expect(result.is_active).toEqual(true);
  });

  it('should save changes to database', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      display_name: 'Database Test',
      role: 'writer'
    };

    await updateUser(updateInput);

    // Verify changes were saved to database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].display_name).toEqual('Database Test');
    expect(users[0].role).toEqual('writer');
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999,
      display_name: 'Non-existent User'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should preserve unchanged fields', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      bio: 'Only bio updated'
    };

    const result = await updateUser(updateInput);

    // These fields should remain unchanged
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.display_name).toEqual('Test User');
    expect(result.role).toEqual('reader');
    expect(result.is_active).toEqual(true);
    
    // Only bio should be updated
    expect(result.bio).toEqual('Only bio updated');
  });
});


import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users
    const passwordHash = 'hashed_password_123';
    
    await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@example.com',
          password_hash: passwordHash,
          role: 'reader',
          display_name: 'User One',
          coin_balance: '100.50'
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password_hash: passwordHash,
          role: 'writer',
          display_name: 'User Two',
          coin_balance: '25.75'
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Verify first user
    const user1 = result.find(u => u.username === 'user1');
    expect(user1).toBeDefined();
    expect(user1!.email).toBe('user1@example.com');
    expect(user1!.role).toBe('reader');
    expect(user1!.display_name).toBe('User One');
    expect(user1!.coin_balance).toBe(100.50);
    expect(typeof user1!.coin_balance).toBe('number');
    expect(user1!.is_active).toBe(true);
    expect(user1!.email_verified).toBe(false);
    expect(user1!.created_at).toBeInstanceOf(Date);
    expect(user1!.updated_at).toBeInstanceOf(Date);

    // Verify second user
    const user2 = result.find(u => u.username === 'user2');
    expect(user2).toBeDefined();
    expect(user2!.role).toBe('writer');
    expect(user2!.coin_balance).toBe(25.75);
    expect(typeof user2!.coin_balance).toBe('number');
  });

  it('should handle users with different roles', async () => {
    const passwordHash = 'hashed_password_123';
    
    await db.insert(usersTable)
      .values([
        {
          username: 'visitor1',
          email: 'visitor@example.com',
          password_hash: passwordHash,
          role: 'visitor'
        },
        {
          username: 'admin1',
          email: 'admin@example.com',
          password_hash: passwordHash,
          role: 'admin'
        }
      ])
      .execute();

    const result = await getUsers();
    expect(result).toHaveLength(2);

    const roles = result.map(u => u.role);
    expect(roles).toContain('visitor');
    expect(roles).toContain('admin');
  });

  it('should handle users with null optional fields', async () => {
    const passwordHash = 'hashed_password_123';
    
    await db.insert(usersTable)
      .values({
        username: 'minimal_user',
        email: 'minimal@example.com',
        password_hash: passwordHash,
        role: 'reader',
        display_name: null,
        avatar_url: null,
        bio: null
      })
      .execute();

    const result = await getUsers();
    expect(result).toHaveLength(1);

    const user = result[0];
    expect(user.display_name).toBeNull();
    expect(user.avatar_url).toBeNull();
    expect(user.bio).toBeNull();
    expect(user.coin_balance).toBe(0);
  });
});

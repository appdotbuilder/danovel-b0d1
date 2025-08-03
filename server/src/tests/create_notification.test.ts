
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { notificationsTable, usersTable } from '../db/schema';
import { type CreateNotificationInput } from '../schema';
import { createNotification } from '../handlers/create_notification';
import { eq } from 'drizzle-orm';

describe('createNotification', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create test user first
    const testUser = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password_123',
        role: 'reader'
      })
      .returning()
      .execute();

    testUserId = testUser[0].id;
  });

  it('should create a notification with all fields', async () => {
    const testInput: CreateNotificationInput = {
      user_id: testUserId,
      type: 'new_chapter',
      title: 'New Chapter Available',
      message: 'Chapter 5 of your favorite novel is now available!',
      reference_id: 123
    };

    const result = await createNotification(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.type).toEqual('new_chapter');
    expect(result.title).toEqual('New Chapter Available');
    expect(result.message).toEqual('Chapter 5 of your favorite novel is now available!');
    expect(result.reference_id).toEqual(123);
    expect(result.is_read).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a notification without reference_id', async () => {
    const testInput: CreateNotificationInput = {
      user_id: testUserId,
      type: 'system',
      title: 'System Maintenance',
      message: 'The system will be down for maintenance at 2 AM.'
    };

    const result = await createNotification(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.type).toEqual('system');
    expect(result.title).toEqual('System Maintenance');
    expect(result.message).toEqual('The system will be down for maintenance at 2 AM.');
    expect(result.reference_id).toBeNull();
    expect(result.is_read).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save notification to database', async () => {
    const testInput: CreateNotificationInput = {
      user_id: testUserId,
      type: 'comment_reply',
      title: 'New Reply',
      message: 'Someone replied to your comment.',
      reference_id: 456
    };

    const result = await createNotification(testInput);

    // Query database to verify saved data
    const notifications = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, result.id))
      .execute();

    expect(notifications).toHaveLength(1);
    expect(notifications[0].user_id).toEqual(testUserId);
    expect(notifications[0].type).toEqual('comment_reply');
    expect(notifications[0].title).toEqual('New Reply');
    expect(notifications[0].message).toEqual('Someone replied to your comment.');
    expect(notifications[0].reference_id).toEqual(456);
    expect(notifications[0].is_read).toEqual(false);
    expect(notifications[0].created_at).toBeInstanceOf(Date);
  });

  it('should create writer follow notification', async () => {
    const testInput: CreateNotificationInput = {
      user_id: testUserId,
      type: 'writer_follow',
      title: 'New Follower',
      message: 'You have a new follower!',
      reference_id: 789
    };

    const result = await createNotification(testInput);

    expect(result.type).toEqual('writer_follow');
    expect(result.title).toEqual('New Follower');
    expect(result.message).toEqual('You have a new follower!');
    expect(result.reference_id).toEqual(789);
    expect(result.is_read).toEqual(false);
  });

  it('should handle foreign key constraint violation', async () => {
    const testInput: CreateNotificationInput = {
      user_id: 99999, // Non-existent user ID
      type: 'new_chapter',
      title: 'Test Notification',
      message: 'This should fail due to foreign key constraint.'
    };

    await expect(createNotification(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});

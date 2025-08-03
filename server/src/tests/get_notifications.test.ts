
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, notificationsTable } from '../db/schema';
import { type CreateUserInput, type CreateNotificationInput } from '../schema';
import { getNotifications } from '../handlers/get_notifications';

describe('getNotifications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return notifications for a user', async () => {
    // Create test user
    const userInput: CreateUserInput = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'reader',
      display_name: 'Test User'
    };

    const userResult = await db.insert(usersTable)
      .values({
        username: userInput.username,
        email: userInput.email,
        password_hash: 'hashed_password',
        role: userInput.role,
        display_name: userInput.display_name,
        coin_balance: '0'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test notifications individually to ensure different timestamps
    const notification1Input: CreateNotificationInput = {
      user_id: userId,
      type: 'new_chapter',
      title: 'New Chapter Available',
      message: 'A new chapter has been published',
      reference_id: 1
    };

    await db.insert(notificationsTable)
      .values({
        user_id: notification1Input.user_id,
        type: notification1Input.type,
        title: notification1Input.title,
        message: notification1Input.message,
        reference_id: notification1Input.reference_id
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const notification2Input: CreateNotificationInput = {
      user_id: userId,
      type: 'system',
      title: 'System Maintenance',
      message: 'System will be under maintenance',
      reference_id: null
    };

    await db.insert(notificationsTable)
      .values({
        user_id: notification2Input.user_id,
        type: notification2Input.type,
        title: notification2Input.title,
        message: notification2Input.message,
        reference_id: notification2Input.reference_id
      })
      .execute();

    // Get notifications
    const notifications = await getNotifications(userId);

    expect(notifications).toHaveLength(2);
    
    // Since notifications are ordered by created_at DESC, the second one (system) should be first
    expect(notifications[0].user_id).toEqual(userId);
    expect(notifications[0].type).toEqual('system');
    expect(notifications[0].title).toEqual('System Maintenance');
    expect(notifications[0].message).toEqual('System will be under maintenance');
    expect(notifications[0].reference_id).toBeNull();
    expect(notifications[0].is_read).toBe(false);
    expect(notifications[0].created_at).toBeInstanceOf(Date);
    expect(notifications[0].id).toBeDefined();

    expect(notifications[1].user_id).toEqual(userId);
    expect(notifications[1].type).toEqual('new_chapter');
    expect(notifications[1].title).toEqual('New Chapter Available');
    expect(notifications[1].message).toEqual('A new chapter has been published');
    expect(notifications[1].reference_id).toEqual(1);
    expect(notifications[1].is_read).toBe(false);
    expect(notifications[1].created_at).toBeInstanceOf(Date);
    expect(notifications[1].id).toBeDefined();
  });

  it('should return empty array for user with no notifications', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'emptyuser',
        email: 'empty@example.com',
        password_hash: 'hashed_password',
        role: 'reader',
        coin_balance: '0'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Get notifications (should be empty)
    const notifications = await getNotifications(userId);

    expect(notifications).toHaveLength(0);
  });

  it('should order notifications by creation date descending', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'orderuser',
        email: 'order@example.com',
        password_hash: 'hashed_password',
        role: 'reader',
        coin_balance: '0'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple notifications with slight delay to ensure different timestamps
    await db.insert(notificationsTable)
      .values({
        user_id: userId,
        type: 'system',
        title: 'First Notification',
        message: 'First message',
        reference_id: null
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(notificationsTable)
      .values({
        user_id: userId,
        type: 'new_chapter',
        title: 'Second Notification',
        message: 'Second message',
        reference_id: 2
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(notificationsTable)
      .values({
        user_id: userId,
        type: 'comment_reply',
        title: 'Third Notification',
        message: 'Third message',
        reference_id: 3
      })
      .execute();

    // Get notifications
    const notifications = await getNotifications(userId);

    expect(notifications).toHaveLength(3);
    
    // Verify ordering (newest first)
    expect(notifications[0].title).toEqual('Third Notification');
    expect(notifications[1].title).toEqual('Second Notification');
    expect(notifications[2].title).toEqual('First Notification');

    // Verify timestamps are in descending order
    expect(notifications[0].created_at.getTime()).toBeGreaterThan(notifications[1].created_at.getTime());
    expect(notifications[1].created_at.getTime()).toBeGreaterThan(notifications[2].created_at.getTime());
  });

  it('should only return notifications for the specified user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        role: 'reader',
        coin_balance: '0'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        role: 'reader',
        coin_balance: '0'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create notifications for both users
    await db.insert(notificationsTable)
      .values([
        {
          user_id: user1Id,
          type: 'new_chapter',
          title: 'User 1 Notification',
          message: 'Message for user 1',
          reference_id: null
        },
        {
          user_id: user2Id,
          type: 'system',
          title: 'User 2 Notification',
          message: 'Message for user 2',
          reference_id: null
        }
      ])
      .execute();

    // Get notifications for user 1
    const user1Notifications = await getNotifications(user1Id);

    expect(user1Notifications).toHaveLength(1);
    expect(user1Notifications[0].user_id).toEqual(user1Id);
    expect(user1Notifications[0].title).toEqual('User 1 Notification');

    // Get notifications for user 2
    const user2Notifications = await getNotifications(user2Id);

    expect(user2Notifications).toHaveLength(1);
    expect(user2Notifications[0].user_id).toEqual(user2Id);
    expect(user2Notifications[0].title).toEqual('User 2 Notification');
  });
});


import { db } from '../db';
import { notificationsTable } from '../db/schema';
import { type CreateNotificationInput, type Notification } from '../schema';

export const createNotification = async (input: CreateNotificationInput): Promise<Notification> => {
  try {
    // Insert notification record
    const result = await db.insert(notificationsTable)
      .values({
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        message: input.message,
        reference_id: input.reference_id || null
      })
      .returning()
      .execute();

    const notification = result[0];
    return {
      ...notification,
      reference_id: notification.reference_id
    };
  } catch (error) {
    console.error('Notification creation failed:', error);
    throw error;
  }
};

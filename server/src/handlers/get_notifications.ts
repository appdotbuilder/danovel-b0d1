
import { db } from '../db';
import { notificationsTable } from '../db/schema';
import { type Notification } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getNotifications(userId: number): Promise<Notification[]> {
  try {
    const results = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.user_id, userId))
      .orderBy(desc(notificationsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }
}

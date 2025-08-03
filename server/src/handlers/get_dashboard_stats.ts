
import { db } from '../db';
import { usersTable, novelsTable, chaptersTable, transactionsTable } from '../db/schema';
import { sql, gte, and, eq } from 'drizzle-orm';
import { type DashboardStats } from '../schema';

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get current date boundaries for today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total counts
    const [totalUsersResult] = await db
      .select({ count: sql<string>`count(*)` })
      .from(usersTable)
      .execute();

    const [totalNovelsResult] = await db
      .select({ count: sql<string>`count(*)` })
      .from(novelsTable)
      .execute();

    const [totalChaptersResult] = await db
      .select({ count: sql<string>`count(*)` })
      .from(chaptersTable)
      .execute();

    const [totalTransactionsResult] = await db
      .select({ count: sql<string>`count(*)` })
      .from(transactionsTable)
      .execute();

    // Get total revenue from completed transactions
    const [totalRevenueResult] = await db
      .select({ revenue: sql<string>`coalesce(sum(amount), '0')` })
      .from(transactionsTable)
      .where(eq(transactionsTable.status, 'completed'))
      .execute();

    // Get active users today (users who have created transactions today)
    const [activeUsersTodayResult] = await db
      .select({ count: sql<string>`count(distinct user_id)` })
      .from(transactionsTable)
      .where(
        and(
          gte(transactionsTable.created_at, today),
          sql`${transactionsTable.created_at} < ${tomorrow}`
        )
      )
      .execute();

    // Get new users today
    const [newUsersTodayResult] = await db
      .select({ count: sql<string>`count(*)` })
      .from(usersTable)
      .where(
        and(
          gte(usersTable.created_at, today),
          sql`${usersTable.created_at} < ${tomorrow}`
        )
      )
      .execute();

    // Get chapters published today
    const [chaptersPublishedTodayResult] = await db
      .select({ count: sql<string>`count(*)` })
      .from(chaptersTable)
      .where(
        and(
          eq(chaptersTable.status, 'published'),
          gte(chaptersTable.created_at, today),
          sql`${chaptersTable.created_at} < ${tomorrow}`
        )
      )
      .execute();

    return {
      total_users: parseInt(totalUsersResult.count),
      total_novels: parseInt(totalNovelsResult.count),
      total_chapters: parseInt(totalChaptersResult.count),
      total_transactions: parseInt(totalTransactionsResult.count),
      total_revenue: parseFloat(totalRevenueResult.revenue),
      active_users_today: parseInt(activeUsersTodayResult.count),
      new_users_today: parseInt(newUsersTodayResult.count),
      chapters_published_today: parseInt(chaptersPublishedTodayResult.count)
    };
  } catch (error) {
    console.error('Dashboard stats retrieval failed:', error);
    throw error;
  }
}

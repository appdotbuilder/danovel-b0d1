
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, genresTable, novelsTable, chaptersTable, transactionsTable } from '../db/schema';
import { getDashboardStats } from '../handlers/get_dashboard_stats';
import { eq } from 'drizzle-orm';

describe('getDashboardStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero stats when database is empty', async () => {
    const stats = await getDashboardStats();

    expect(stats.total_users).toEqual(0);
    expect(stats.total_novels).toEqual(0);
    expect(stats.total_chapters).toEqual(0);
    expect(stats.total_transactions).toEqual(0);
    expect(stats.total_revenue).toEqual(0);
    expect(stats.active_users_today).toEqual(0);
    expect(stats.new_users_today).toEqual(0);
    expect(stats.chapters_published_today).toEqual(0);
  });

  it('should return correct totals with sample data', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@test.com',
          password_hash: 'hash1',
          role: 'writer'
        },
        {
          username: 'user2',
          email: 'user2@test.com',
          password_hash: 'hash2',
          role: 'reader'
        }
      ])
      .returning()
      .execute();

    // Create test genre
    const [genre] = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();

    // Create test novels
    const novels = await db.insert(novelsTable)
      .values([
        {
          title: 'Novel 1',
          slug: 'novel-1',
          author_id: users[0].id,
          genre_id: genre.id
        },
        {
          title: 'Novel 2',
          slug: 'novel-2',
          author_id: users[1].id,
          genre_id: genre.id
        }
      ])
      .returning()
      .execute();

    // Create test chapters
    await db.insert(chaptersTable)
      .values([
        {
          novel_id: novels[0].id,
          chapter_number: 1,
          title: 'Chapter 1',
          content: 'Content 1',
          status: 'published'
        },
        {
          novel_id: novels[1].id,
          chapter_number: 1,
          title: 'Chapter 2',
          content: 'Content 2',
          status: 'draft'
        }
      ])
      .execute();

    // Create test transactions
    await db.insert(transactionsTable)
      .values([
        {
          user_id: users[0].id,
          type: 'coin_purchase',
          amount: '10.00',
          coin_amount: '100.00',
          status: 'completed'
        },
        {
          user_id: users[1].id,
          type: 'chapter_unlock',
          amount: '2.50',
          coin_amount: '25.00',
          status: 'completed'
        },
        {
          user_id: users[1].id,
          type: 'coin_purchase',
          amount: '5.00',
          coin_amount: '50.00',
          status: 'pending'
        }
      ])
      .execute();

    const stats = await getDashboardStats();

    expect(stats.total_users).toEqual(2);
    expect(stats.total_novels).toEqual(2);
    expect(stats.total_chapters).toEqual(2);
    expect(stats.total_transactions).toEqual(3);
    expect(stats.total_revenue).toEqual(12.5); // Only completed transactions
  });

  it('should count today stats correctly', async () => {
    // Create users - one today, one yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [todayUser] = await db.insert(usersTable)
      .values({
        username: 'today_user',
        email: 'today@test.com',
        password_hash: 'hash1',
        role: 'writer'
      })
      .returning()
      .execute();

    // Manually set created_at for yesterday user
    await db.insert(usersTable)
      .values({
        username: 'old_user',
        email: 'old@test.com',
        password_hash: 'hash2',
        role: 'reader'
      })
      .execute();

    // Update the old user's created_at to yesterday
    await db.update(usersTable)
      .set({ created_at: yesterday })
      .where(eq(usersTable.username, 'old_user'))
      .execute();

    // Create genre and novel for chapter test
    const [genre] = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();

    const [novel] = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: todayUser.id,
        genre_id: genre.id
      })
      .returning()
      .execute();

    // Create chapter published today
    await db.insert(chaptersTable)
      .values({
        novel_id: novel.id,
        chapter_number: 1,
        title: 'Today Chapter',
        content: 'Content for today',
        status: 'published'
      })
      .execute();

    // Create transaction today (makes user active)
    await db.insert(transactionsTable)
      .values({
        user_id: todayUser.id,
        type: 'coin_purchase',
        amount: '10.00',
        coin_amount: '100.00',
        status: 'completed'
      })
      .execute();

    const stats = await getDashboardStats();

    expect(stats.total_users).toEqual(2);
    expect(stats.new_users_today).toEqual(1); // Only today_user
    expect(stats.active_users_today).toEqual(1); // Only today_user (had transaction)
    expect(stats.chapters_published_today).toEqual(1); // Only published chapter today
  });

  it('should handle numeric conversions correctly', async () => {
    // Create user and transaction with decimal amounts
    const [user] = await db.insert(usersTable)
      .values({
        username: 'test_user',
        email: 'test@test.com',
        password_hash: 'hash1',
        role: 'reader'
      })
      .returning()
      .execute();

    await db.insert(transactionsTable)
      .values({
        user_id: user.id,
        type: 'coin_purchase',
        amount: '99.99',
        coin_amount: '999.90',
        status: 'completed'
      })
      .execute();

    const stats = await getDashboardStats();

    expect(typeof stats.total_revenue).toBe('number');
    expect(stats.total_revenue).toEqual(99.99);
    expect(typeof stats.total_users).toBe('number');
    expect(typeof stats.total_transactions).toBe('number');
  });
});

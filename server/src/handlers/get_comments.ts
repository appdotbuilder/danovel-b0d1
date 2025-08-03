
import { db } from '../db';
import { commentsTable, usersTable } from '../db/schema';
import { type Comment } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getComments(chapterId: number): Promise<Comment[]> {
  try {
    // Fetch comments with user information
    const results = await db.select({
      id: commentsTable.id,
      user_id: commentsTable.user_id,
      chapter_id: commentsTable.chapter_id,
      parent_id: commentsTable.parent_id,
      content: commentsTable.content,
      likes: commentsTable.likes,
      is_deleted: commentsTable.is_deleted,
      created_at: commentsTable.created_at,
      updated_at: commentsTable.updated_at,
      username: usersTable.username,
      display_name: usersTable.display_name,
      avatar_url: usersTable.avatar_url
    })
    .from(commentsTable)
    .innerJoin(usersTable, eq(commentsTable.user_id, usersTable.id))
    .where(eq(commentsTable.chapter_id, chapterId))
    .orderBy(asc(commentsTable.created_at))
    .execute();

    // Transform results to match Comment schema
    return results.map(result => ({
      id: result.id,
      user_id: result.user_id,
      chapter_id: result.chapter_id,
      parent_id: result.parent_id,
      content: result.content,
      likes: result.likes,
      is_deleted: result.is_deleted,
      created_at: result.created_at,
      updated_at: result.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    throw error;
  }
}

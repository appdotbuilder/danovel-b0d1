
import { db } from '../db';
import { commentsTable, chaptersTable, usersTable } from '../db/schema';
import { type CreateCommentInput, type Comment } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createComment = async (input: CreateCommentInput): Promise<Comment> => {
  try {
    // Verify that the user exists
    const userExists = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Verify that the chapter exists
    const chapterExists = await db.select({ id: chaptersTable.id })
      .from(chaptersTable)
      .where(eq(chaptersTable.id, input.chapter_id))
      .execute();

    if (chapterExists.length === 0) {
      throw new Error(`Chapter with id ${input.chapter_id} does not exist`);
    }

    // If parent_id is provided, verify that the parent comment exists
    if (input.parent_id) {
      const parentExists = await db.select({ id: commentsTable.id })
        .from(commentsTable)
        .where(
          and(
            eq(commentsTable.id, input.parent_id),
            eq(commentsTable.chapter_id, input.chapter_id) // Ensure parent is on same chapter
          )
        )
        .execute();

      if (parentExists.length === 0) {
        throw new Error(`Parent comment with id ${input.parent_id} does not exist or is not on the same chapter`);
      }
    }

    // Insert comment record
    const result = await db.insert(commentsTable)
      .values({
        user_id: input.user_id,
        chapter_id: input.chapter_id,
        parent_id: input.parent_id || null,
        content: input.content
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Comment creation failed:', error);
    throw error;
  }
};

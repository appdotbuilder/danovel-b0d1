
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, genresTable, novelsTable, chaptersTable, commentsTable } from '../db/schema';
import { type CreateCommentInput } from '../schema';
import { createComment } from '../handlers/create_comment';
import { eq, and } from 'drizzle-orm';

describe('createComment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testChapterId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'reader'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();

    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: testUserId,
        genre_id: genreResult[0].id
      })
      .returning()
      .execute();

    const chapterResult = await db.insert(chaptersTable)
      .values({
        novel_id: novelResult[0].id,
        chapter_number: 1,
        title: 'Chapter 1',
        content: 'Test chapter content'
      })
      .returning()
      .execute();
    testChapterId = chapterResult[0].id;
  });

  it('should create a comment', async () => {
    const testInput: CreateCommentInput = {
      user_id: testUserId,
      chapter_id: testChapterId,
      content: 'This is a test comment'
    };

    const result = await createComment(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.chapter_id).toEqual(testChapterId);
    expect(result.parent_id).toBeNull();
    expect(result.content).toEqual('This is a test comment');
    expect(result.likes).toEqual(0);
    expect(result.is_deleted).toBe(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save comment to database', async () => {
    const testInput: CreateCommentInput = {
      user_id: testUserId,
      chapter_id: testChapterId,
      content: 'This is a test comment'
    };

    const result = await createComment(testInput);

    const comments = await db.select()
      .from(commentsTable)
      .where(eq(commentsTable.id, result.id))
      .execute();

    expect(comments).toHaveLength(1);
    expect(comments[0].user_id).toEqual(testUserId);
    expect(comments[0].chapter_id).toEqual(testChapterId);
    expect(comments[0].content).toEqual('This is a test comment');
    expect(comments[0].parent_id).toBeNull();
  });

  it('should create a reply comment', async () => {
    // First create a parent comment
    const parentInput: CreateCommentInput = {
      user_id: testUserId,
      chapter_id: testChapterId,
      content: 'Parent comment'
    };

    const parentComment = await createComment(parentInput);

    // Now create a reply
    const replyInput: CreateCommentInput = {
      user_id: testUserId,
      chapter_id: testChapterId,
      parent_id: parentComment.id,
      content: 'Reply to parent comment'
    };

    const result = await createComment(replyInput);

    expect(result.parent_id).toEqual(parentComment.id);
    expect(result.content).toEqual('Reply to parent comment');
    expect(result.chapter_id).toEqual(testChapterId);
  });

  it('should fail when user does not exist', async () => {
    const testInput: CreateCommentInput = {
      user_id: 99999,
      chapter_id: testChapterId,
      content: 'This comment should fail'
    };

    expect(createComment(testInput)).rejects.toThrow(/user.*does not exist/i);
  });

  it('should fail when chapter does not exist', async () => {
    const testInput: CreateCommentInput = {
      user_id: testUserId,
      chapter_id: 99999,
      content: 'This comment should fail'
    };

    expect(createComment(testInput)).rejects.toThrow(/chapter.*does not exist/i);
  });

  it('should fail when parent comment does not exist', async () => {
    const testInput: CreateCommentInput = {
      user_id: testUserId,
      chapter_id: testChapterId,
      parent_id: 99999,
      content: 'This reply should fail'
    };

    expect(createComment(testInput)).rejects.toThrow(/parent comment.*does not exist/i);
  });

  it('should fail when parent comment is on different chapter', async () => {
    // Create another chapter
    const anotherChapterResult = await db.insert(chaptersTable)
      .values({
        novel_id: testChapterId, // Using testChapterId as novel_id for simplicity
        chapter_number: 2,
        title: 'Chapter 2',
        content: 'Another chapter content'
      })
      .returning()
      .execute();

    // Create comment on first chapter
    const parentInput: CreateCommentInput = {
      user_id: testUserId,
      chapter_id: testChapterId,
      content: 'Parent comment on chapter 1'
    };

    const parentComment = await createComment(parentInput);

    // Try to reply on different chapter
    const replyInput: CreateCommentInput = {
      user_id: testUserId,
      chapter_id: anotherChapterResult[0].id,
      parent_id: parentComment.id,
      content: 'Reply on different chapter'
    };

    expect(createComment(replyInput)).rejects.toThrow(/parent comment.*does not exist.*same chapter/i);
  });

  it('should handle content with special characters', async () => {
    const testInput: CreateCommentInput = {
      user_id: testUserId,
      chapter_id: testChapterId,
      content: 'Comment with special chars: !@#$%^&*()_+ "quotes" and \'apostrophes\''
    };

    const result = await createComment(testInput);

    expect(result.content).toEqual('Comment with special chars: !@#$%^&*()_+ "quotes" and \'apostrophes\'');
  });
});

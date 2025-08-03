
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, genresTable, novelsTable, chaptersTable, commentsTable } from '../db/schema';
import { getComments } from '../handlers/get_comments';

describe('getComments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no comments exist', async () => {
    const result = await getComments(999);
    expect(result).toEqual([]);
  });

  it('should fetch comments for a specific chapter', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test genre
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();
    const genreId = genreResult[0].id;

    // Create test novel
    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: userId,
        genre_id: genreId
      })
      .returning()
      .execute();
    const novelId = novelResult[0].id;

    // Create test chapter
    const chapterResult = await db.insert(chaptersTable)
      .values({
        novel_id: novelId,
        chapter_number: 1,
        title: 'Test Chapter',
        content: 'Chapter content'
      })
      .returning()
      .execute();
    const chapterId = chapterResult[0].id;

    // Create test comments individually to ensure order
    const firstCommentResult = await db.insert(commentsTable)
      .values({
        user_id: userId,
        chapter_id: chapterId,
        content: 'First comment'
      })
      .returning()
      .execute();

    const secondCommentResult = await db.insert(commentsTable)
      .values({
        user_id: userId,
        chapter_id: chapterId,
        content: 'Second comment'
      })
      .returning()
      .execute();

    const result = await getComments(chapterId);

    expect(result).toHaveLength(2);
    
    // Find comments by content instead of assuming order
    const firstComment = result.find(c => c.content === 'First comment');
    const secondComment = result.find(c => c.content === 'Second comment');
    
    expect(firstComment).toBeDefined();
    expect(secondComment).toBeDefined();
    expect(firstComment!.chapter_id).toEqual(chapterId);
    expect(secondComment!.chapter_id).toEqual(chapterId);
    expect(firstComment!.user_id).toEqual(userId);
    expect(secondComment!.user_id).toEqual(userId);
    expect(firstComment!.likes).toEqual(0);
    expect(firstComment!.is_deleted).toEqual(false);
    expect(firstComment!.parent_id).toBeNull();
    expect(firstComment!.created_at).toBeInstanceOf(Date);
    expect(firstComment!.updated_at).toBeInstanceOf(Date);
  });

  it('should return comments ordered by creation time', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test genre
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();
    const genreId = genreResult[0].id;

    // Create test novel
    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: userId,
        genre_id: genreId
      })
      .returning()
      .execute();
    const novelId = novelResult[0].id;

    // Create test chapter
    const chapterResult = await db.insert(chaptersTable)
      .values({
        novel_id: novelId,
        chapter_number: 1,
        title: 'Test Chapter',
        content: 'Chapter content'
      })
      .returning()
      .execute();
    const chapterId = chapterResult[0].id;

    // Create comments with different timestamps
    const firstComment = await db.insert(commentsTable)
      .values({
        user_id: userId,
        chapter_id: chapterId,
        content: 'Oldest comment'
      })
      .returning()
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(commentsTable)
      .values({
        user_id: userId,
        chapter_id: chapterId,
        content: 'Newest comment'
      })
      .execute();

    const result = await getComments(chapterId);

    expect(result).toHaveLength(2);
    expect(result[0].content).toEqual('Oldest comment');
    expect(result[1].content).toEqual('Newest comment');
    expect(result[0].created_at.getTime()).toBeLessThan(result[1].created_at.getTime());
  });

  it('should include parent_id for reply comments', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test genre
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();
    const genreId = genreResult[0].id;

    // Create test novel
    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: userId,
        genre_id: genreId
      })
      .returning()
      .execute();
    const novelId = novelResult[0].id;

    // Create test chapter
    const chapterResult = await db.insert(chaptersTable)
      .values({
        novel_id: novelId,
        chapter_number: 1,
        title: 'Test Chapter',
        content: 'Chapter content'
      })
      .returning()
      .execute();
    const chapterId = chapterResult[0].id;

    // Create parent comment
    const parentResult = await db.insert(commentsTable)
      .values({
        user_id: userId,
        chapter_id: chapterId,
        content: 'Parent comment'
      })
      .returning()
      .execute();
    const parentId = parentResult[0].id;

    // Create reply comment
    await db.insert(commentsTable)
      .values({
        user_id: userId,
        chapter_id: chapterId,
        parent_id: parentId,
        content: 'Reply comment'
      })
      .execute();

    const result = await getComments(chapterId);

    expect(result).toHaveLength(2);
    
    const parentComment = result.find(c => c.content === 'Parent comment');
    const replyComment = result.find(c => c.content === 'Reply comment');
    
    expect(parentComment?.parent_id).toBeNull();
    expect(replyComment?.parent_id).toEqual(parentId);
  });

  it('should only return comments for the specified chapter', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test genre
    const genreResult = await db.insert(genresTable)
      .values({
        name: 'Fantasy',
        slug: 'fantasy'
      })
      .returning()
      .execute();
    const genreId = genreResult[0].id;

    // Create test novel
    const novelResult = await db.insert(novelsTable)
      .values({
        title: 'Test Novel',
        slug: 'test-novel',
        author_id: userId,
        genre_id: genreId
      })
      .returning()
      .execute();
    const novelId = novelResult[0].id;

    // Create two test chapters
    const chapter1Result = await db.insert(chaptersTable)
      .values({
        novel_id: novelId,
        chapter_number: 1,
        title: 'Chapter 1',
        content: 'Chapter 1 content'
      })
      .returning()
      .execute();
    const chapter1Id = chapter1Result[0].id;

    const chapter2Result = await db.insert(chaptersTable)
      .values({
        novel_id: novelId,
        chapter_number: 2,
        title: 'Chapter 2',
        content: 'Chapter 2 content'
      })
      .returning()
      .execute();
    const chapter2Id = chapter2Result[0].id;

    // Create comments for both chapters
    await db.insert(commentsTable)
      .values({
        user_id: userId,
        chapter_id: chapter1Id,
        content: 'Comment on chapter 1'
      })
      .execute();

    await db.insert(commentsTable)
      .values({
        user_id: userId,
        chapter_id: chapter2Id,
        content: 'Comment on chapter 2'
      })
      .execute();

    const result = await getComments(chapter1Id);

    expect(result).toHaveLength(1);
    expect(result[0].content).toEqual('Comment on chapter 1');
    expect(result[0].chapter_id).toEqual(chapter1Id);
  });
});

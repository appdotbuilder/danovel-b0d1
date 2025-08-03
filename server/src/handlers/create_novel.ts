
import { db } from '../db';
import { novelsTable, usersTable, genresTable } from '../db/schema';
import { type CreateNovelInput, type Novel } from '../schema';
import { eq } from 'drizzle-orm';

export const createNovel = async (input: CreateNovelInput): Promise<Novel> => {
  try {
    // Verify author exists and has appropriate role
    const author = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.author_id))
      .execute();

    if (author.length === 0) {
      throw new Error('Author not found');
    }

    if (author[0].role !== 'writer' && author[0].role !== 'admin') {
      throw new Error('User does not have permission to create novels');
    }

    // Verify genre exists
    const genre = await db.select()
      .from(genresTable)
      .where(eq(genresTable.id, input.genre_id))
      .execute();

    if (genre.length === 0) {
      throw new Error('Genre not found');
    }

    // Check slug uniqueness
    const existingNovel = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.slug, input.slug))
      .execute();

    if (existingNovel.length > 0) {
      throw new Error('A novel with this slug already exists');
    }

    // Insert novel record
    const result = await db.insert(novelsTable)
      .values({
        title: input.title,
        slug: input.slug,
        description: input.description || null,
        cover_image_url: input.cover_image_url || null,
        author_id: input.author_id,
        status: input.status,
        genre_id: input.genre_id,
        is_premium: input.is_premium
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const novel = result[0];
    return {
      ...novel,
      average_rating: novel.average_rating ? parseFloat(novel.average_rating) : null
    };
  } catch (error) {
    console.error('Novel creation failed:', error);
    throw error;
  }
};

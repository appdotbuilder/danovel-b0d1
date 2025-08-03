
import { db } from '../db';
import { novelsTable } from '../db/schema';
import { type UpdateNovelInput, type Novel } from '../schema';
import { eq } from 'drizzle-orm';

export const updateNovel = async (input: UpdateNovelInput): Promise<Novel> => {
  try {
    // First verify the novel exists
    const existingNovel = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, input.id))
      .execute();

    if (existingNovel.length === 0) {
      throw new Error(`Novel with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.cover_image_url !== undefined) {
      updateData.cover_image_url = input.cover_image_url;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.genre_id !== undefined) {
      updateData.genre_id = input.genre_id;
    }
    if (input.is_featured !== undefined) {
      updateData.is_featured = input.is_featured;
    }
    if (input.is_premium !== undefined) {
      updateData.is_premium = input.is_premium;
    }

    // Update the novel
    const result = await db.update(novelsTable)
      .set(updateData)
      .where(eq(novelsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers
    const novel = result[0];
    return {
      ...novel,
      average_rating: novel.average_rating ? parseFloat(novel.average_rating) : null
    };
  } catch (error) {
    console.error('Novel update failed:', error);
    throw error;
  }
};

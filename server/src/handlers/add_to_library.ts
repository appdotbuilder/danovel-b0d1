
import { db } from '../db';
import { libraryTable, usersTable, novelsTable } from '../db/schema';
import { type AddToLibraryInput, type Library } from '../schema';
import { eq, and } from 'drizzle-orm';

export const addToLibrary = async (input: AddToLibraryInput): Promise<Library> => {
  try {
    // Check if user exists
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Check if novel exists
    const novelExists = await db.select()
      .from(novelsTable)
      .where(eq(novelsTable.id, input.novel_id))
      .execute();

    if (novelExists.length === 0) {
      throw new Error(`Novel with id ${input.novel_id} not found`);
    }

    // Check if entry already exists
    const existingEntry = await db.select()
      .from(libraryTable)
      .where(and(
        eq(libraryTable.user_id, input.user_id),
        eq(libraryTable.novel_id, input.novel_id)
      ))
      .execute();

    if (existingEntry.length > 0) {
      throw new Error('Novel is already in user\'s library');
    }

    // Insert library entry
    const result = await db.insert(libraryTable)
      .values({
        user_id: input.user_id,
        novel_id: input.novel_id,
        is_favorite: input.is_favorite
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Add to library failed:', error);
    throw error;
  }
};

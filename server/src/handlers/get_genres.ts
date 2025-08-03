
import { db } from '../db';
import { genresTable } from '../db/schema';
import { type Genre } from '../schema';

export const getGenres = async (): Promise<Genre[]> => {
  try {
    const result = await db.select()
      .from(genresTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Get genres failed:', error);
    throw error;
  }
};

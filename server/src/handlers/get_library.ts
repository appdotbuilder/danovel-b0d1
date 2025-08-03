
import { db } from '../db';
import { libraryTable, novelsTable, usersTable, genresTable, readingProgressTable } from '../db/schema';
import { type Library } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getLibrary(userId: number): Promise<Library[]> {
  try {
    const results = await db.select({
      id: libraryTable.id,
      user_id: libraryTable.user_id,
      novel_id: libraryTable.novel_id,
      is_favorite: libraryTable.is_favorite,
      added_at: libraryTable.added_at,
      novel_title: novelsTable.title,
      novel_slug: novelsTable.slug,
      novel_cover_image_url: novelsTable.cover_image_url,
      novel_status: novelsTable.status,
      author_display_name: usersTable.display_name,
      author_username: usersTable.username,
      genre_name: genresTable.name,
      reading_progress_percentage: readingProgressTable.progress_percentage,
      last_read_at: readingProgressTable.last_read_at
    })
    .from(libraryTable)
    .innerJoin(novelsTable, eq(libraryTable.novel_id, novelsTable.id))
    .innerJoin(usersTable, eq(novelsTable.author_id, usersTable.id))
    .innerJoin(genresTable, eq(novelsTable.genre_id, genresTable.id))
    .leftJoin(readingProgressTable, eq(libraryTable.novel_id, readingProgressTable.novel_id))
    .where(eq(libraryTable.user_id, userId))
    .orderBy(desc(libraryTable.added_at))
    .execute();

    return results.map(result => ({
      id: result.id,
      user_id: result.user_id,
      novel_id: result.novel_id,
      is_favorite: result.is_favorite,
      added_at: result.added_at
    }));
  } catch (error) {
    console.error('Library fetch failed:', error);
    throw error;
  }
}

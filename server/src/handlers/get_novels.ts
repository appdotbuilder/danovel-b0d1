
import { db } from '../db';
import { novelsTable } from '../db/schema';
import { type Novel } from '../schema';
import { eq, and, desc, asc, type SQL } from 'drizzle-orm';

export interface GetNovelsFilters {
  genre_id?: number;
  status?: 'draft' | 'ongoing' | 'completed' | 'hiatus' | 'dropped';
  is_featured?: boolean;
  is_premium?: boolean;
  author_id?: number;
}

export interface GetNovelsOptions {
  filters?: GetNovelsFilters;
  sortBy?: 'recent' | 'popular' | 'rating' | 'title';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export const getNovels = async (options: GetNovelsOptions = {}): Promise<Novel[]> => {
  try {
    const {
      filters = {},
      sortBy = 'recent',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = options;

    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filters.genre_id !== undefined) {
      conditions.push(eq(novelsTable.genre_id, filters.genre_id));
    }

    if (filters.status !== undefined) {
      conditions.push(eq(novelsTable.status, filters.status));
    }

    if (filters.is_featured !== undefined) {
      conditions.push(eq(novelsTable.is_featured, filters.is_featured));
    }

    if (filters.is_premium !== undefined) {
      conditions.push(eq(novelsTable.is_premium, filters.is_premium));
    }

    if (filters.author_id !== undefined) {
      conditions.push(eq(novelsTable.author_id, filters.author_id));
    }

    // Create the complete query in one go to avoid TypeScript issues
    const orderDirection = sortOrder === 'asc' ? asc : desc;
    let orderByColumn;
    
    switch (sortBy) {
      case 'popular':
        orderByColumn = orderDirection(novelsTable.total_views);
        break;
      case 'rating':
        orderByColumn = orderDirection(novelsTable.average_rating);
        break;
      case 'title':
        orderByColumn = orderDirection(novelsTable.title);
        break;
      case 'recent':
      default:
        orderByColumn = orderDirection(novelsTable.created_at);
        break;
    }

    // Build the final query in one step
    const query = conditions.length > 0
      ? db.select()
          .from(novelsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(orderByColumn)
          .limit(limit)
          .offset(offset)
      : db.select()
          .from(novelsTable)
          .orderBy(orderByColumn)
          .limit(limit)
          .offset(offset);

    const results = await query.execute();

    // Convert numeric fields back to numbers
    return results.map(novel => ({
      ...novel,
      average_rating: novel.average_rating ? parseFloat(novel.average_rating) : null
    }));
  } catch (error) {
    console.error('Get novels failed:', error);
    throw error;
  }
};

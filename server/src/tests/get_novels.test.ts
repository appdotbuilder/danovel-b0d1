
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, genresTable, novelsTable } from '../db/schema';
import { getNovels, type GetNovelsFilters, type GetNovelsOptions } from '../handlers/get_novels';

// Helper to create test user
const createTestUser = async () => {
  const userData = {
    username: 'testauthor',
    email: 'author@test.com',
    password_hash: 'hashed_password',
    role: 'writer' as const,
    display_name: 'Test Author'
  };

  const result = await db.insert(usersTable)
    .values(userData)
    .returning()
    .execute();

  return result[0];
};

// Helper to create test genre
const createTestGenre = async () => {
  const genreData = {
    name: 'Fantasy',
    slug: 'fantasy',
    description: 'Fantasy novels'
  };

  const result = await db.insert(genresTable)
    .values(genreData)
    .returning()
    .execute();

  return result[0];
};

// Helper to create test novel with unique slug
let novelCounter = 0;
const createTestNovel = async (author_id: number, genre_id: number, overrides = {}) => {
  novelCounter++;
  const novelData = {
    title: 'Test Novel',
    slug: `test-novel-${novelCounter}`, // Make slug unique
    description: 'A test novel',
    author_id,
    genre_id,
    status: 'ongoing' as const,
    is_premium: false,
    is_featured: false,
    total_views: 100,
    total_likes: 50,
    ...overrides
  };

  const result = await db.insert(novelsTable)
    .values(novelData)
    .returning()
    .execute();

  return result[0];
};

describe('getNovels', () => {
  beforeEach(() => {
    novelCounter = 0; // Reset counter for each test
    return createDB();
  });
  afterEach(resetDB);

  it('should return empty array when no novels exist', async () => {
    const result = await getNovels();
    expect(result).toEqual([]);
  });

  it('should return novels with default sorting (recent)', async () => {
    // Create prerequisites
    const user = await createTestUser();
    const genre = await createTestGenre();

    // Create test novels with different creation times
    const novel1 = await createTestNovel(user.id, genre.id, { 
      title: 'First Novel',
      slug: 'first-novel' 
    });
    
    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const novel2 = await createTestNovel(user.id, genre.id, { 
      title: 'Second Novel',
      slug: 'second-novel' 
    });

    const result = await getNovels();

    expect(result).toHaveLength(2);
    // Should be sorted by creation date desc (most recent first)
    expect(result[0].title).toBe('Second Novel');
    expect(result[1].title).toBe('First Novel');
    expect(result[0].author_id).toBe(user.id);
    expect(result[0].genre_id).toBe(genre.id);
  });

  it('should filter novels by genre', async () => {
    const user = await createTestUser();
    const fantasyGenre = await createTestGenre();
    
    // Create second genre
    const scifiGenre = await db.insert(genresTable)
      .values({
        name: 'Science Fiction',
        slug: 'sci-fi',
        description: 'Sci-fi novels'
      })
      .returning()
      .execute();

    await createTestNovel(user.id, fantasyGenre.id, { 
      title: 'Fantasy Novel',
      slug: 'fantasy-novel'
    });
    await createTestNovel(user.id, scifiGenre[0].id, { 
      title: 'Sci-Fi Novel',
      slug: 'scifi-novel'
    });

    const filters: GetNovelsFilters = { genre_id: fantasyGenre.id };
    const result = await getNovels({ filters });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Fantasy Novel');
    expect(result[0].genre_id).toBe(fantasyGenre.id);
  });

  it('should filter novels by status', async () => {
    const user = await createTestUser();
    const genre = await createTestGenre();

    await createTestNovel(user.id, genre.id, { 
      title: 'Draft Novel',
      slug: 'draft-novel',
      status: 'draft' 
    });
    await createTestNovel(user.id, genre.id, { 
      title: 'Completed Novel',
      slug: 'completed-novel',
      status: 'completed' 
    });

    const filters: GetNovelsFilters = { status: 'completed' };
    const result = await getNovels({ filters });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Completed Novel');
    expect(result[0].status).toBe('completed');
  });

  it('should filter novels by featured status', async () => {
    const user = await createTestUser();
    const genre = await createTestGenre();

    await createTestNovel(user.id, genre.id, { 
      title: 'Regular Novel',
      slug: 'regular-novel',
      is_featured: false 
    });
    await createTestNovel(user.id, genre.id, { 
      title: 'Featured Novel',
      slug: 'featured-novel',
      is_featured: true 
    });

    const filters: GetNovelsFilters = { is_featured: true };
    const result = await getNovels({ filters });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Featured Novel');
    expect(result[0].is_featured).toBe(true);
  });

  it('should sort novels by popularity (views)', async () => {
    const user = await createTestUser();
    const genre = await createTestGenre();

    await createTestNovel(user.id, genre.id, { 
      title: 'Less Popular',
      slug: 'less-popular',
      total_views: 50 
    });
    await createTestNovel(user.id, genre.id, { 
      title: 'More Popular',
      slug: 'more-popular',
      total_views: 200 
    });

    const options: GetNovelsOptions = { sortBy: 'popular' };
    const result = await getNovels(options);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('More Popular');
    expect(result[0].total_views).toBe(200);
    expect(result[1].title).toBe('Less Popular');
    expect(result[1].total_views).toBe(50);
  });

  it('should sort novels by rating', async () => {
    const user = await createTestUser();
    const genre = await createTestGenre();

    await createTestNovel(user.id, genre.id, { 
      title: 'Lower Rated',
      slug: 'lower-rated',
      average_rating: '3.5' 
    });
    await createTestNovel(user.id, genre.id, { 
      title: 'Higher Rated',
      slug: 'higher-rated',
      average_rating: '4.8' 
    });

    const options: GetNovelsOptions = { sortBy: 'rating' };
    const result = await getNovels(options);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Higher Rated');
    expect(result[0].average_rating).toBe(4.8);
    expect(typeof result[0].average_rating).toBe('number');
    expect(result[1].title).toBe('Lower Rated');
    expect(result[1].average_rating).toBe(3.5);
  });

  it('should handle pagination correctly', async () => {
    const user = await createTestUser();
    const genre = await createTestGenre();

    // Create 5 novels
    for (let i = 1; i <= 5; i++) {
      await createTestNovel(user.id, genre.id, { 
        title: `Novel ${i}`,
        slug: `novel-${i}` 
      });
    }

    // Get first page (limit 2)
    const page1 = await getNovels({ limit: 2, offset: 0 });
    expect(page1).toHaveLength(2);

    // Get second page
    const page2 = await getNovels({ limit: 2, offset: 2 });
    expect(page2).toHaveLength(2);

    // Get third page (should have 1 remaining)
    const page3 = await getNovels({ limit: 2, offset: 4 });
    expect(page3).toHaveLength(1);

    // Ensure no duplicates across pages
    const allIds = [...page1, ...page2, ...page3].map(n => n.id);
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(5);
  });

  it('should apply multiple filters together', async () => {
    const user = await createTestUser();
    const genre = await createTestGenre();

    await createTestNovel(user.id, genre.id, { 
      title: 'Featured Premium',
      slug: 'featured-premium',
      is_featured: true,
      is_premium: true,
      status: 'ongoing'
    });
    await createTestNovel(user.id, genre.id, { 
      title: 'Featured Free',
      slug: 'featured-free',
      is_featured: true,
      is_premium: false,
      status: 'ongoing'
    });
    await createTestNovel(user.id, genre.id, { 
      title: 'Regular Premium',
      slug: 'regular-premium',
      is_featured: false,
      is_premium: true,
      status: 'completed'
    });

    const filters: GetNovelsFilters = { 
      is_featured: true,
      is_premium: true,
      status: 'ongoing'
    };
    const result = await getNovels({ filters });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Featured Premium');
    expect(result[0].is_featured).toBe(true);
    expect(result[0].is_premium).toBe(true);
    expect(result[0].status).toBe('ongoing');
  });

  it('should handle ascending sort order', async () => {
    const user = await createTestUser();
    const genre = await createTestGenre();

    await createTestNovel(user.id, genre.id, { 
      title: 'Z Novel',
      slug: 'z-novel',
      total_views: 300 
    });
    await createTestNovel(user.id, genre.id, { 
      title: 'A Novel',
      slug: 'a-novel',
      total_views: 100 
    });

    const options: GetNovelsOptions = { 
      sortBy: 'popular',
      sortOrder: 'asc' 
    };
    const result = await getNovels(options);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('A Novel');
    expect(result[0].total_views).toBe(100);
    expect(result[1].title).toBe('Z Novel');
    expect(result[1].total_views).toBe(300);
  });

  it('should handle novels with null average_rating', async () => {
    const user = await createTestUser();
    const genre = await createTestGenre();

    await createTestNovel(user.id, genre.id, { 
      title: 'No Rating Novel',
      slug: 'no-rating-novel',
      average_rating: null
    });

    const result = await getNovels();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('No Rating Novel');
    expect(result[0].average_rating).toBe(null);
  });

  it('should filter by author_id', async () => {
    const user1 = await createTestUser();
    const user2 = await db.insert(usersTable)
      .values({
        username: 'author2',
        email: 'author2@test.com',
        password_hash: 'hashed_password',
        role: 'writer' as const,
        display_name: 'Author Two'
      })
      .returning()
      .execute();

    const genre = await createTestGenre();

    await createTestNovel(user1.id, genre.id, { 
      title: 'Novel by Author 1',
      slug: 'novel-by-author-1'
    });
    await createTestNovel(user2[0].id, genre.id, { 
      title: 'Novel by Author 2',
      slug: 'novel-by-author-2'
    });

    const filters: GetNovelsFilters = { author_id: user1.id };
    const result = await getNovels({ filters });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Novel by Author 1');
    expect(result[0].author_id).toBe(user1.id);
  });
});

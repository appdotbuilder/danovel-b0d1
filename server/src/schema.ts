
import { z } from 'zod';

// Enums
export const userRoleSchema = z.enum(['visitor', 'reader', 'writer', 'admin']);
export const novelStatusSchema = z.enum(['draft', 'ongoing', 'completed', 'hiatus', 'dropped']);
export const chapterStatusSchema = z.enum(['draft', 'published', 'scheduled']);
export const transactionTypeSchema = z.enum(['coin_purchase', 'chapter_unlock', 'writer_payout']);
export const transactionStatusSchema = z.enum(['pending', 'completed', 'failed', 'refunded']);
export const notificationTypeSchema = z.enum(['new_chapter', 'writer_follow', 'comment_reply', 'system']);

// User schemas
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  role: userRoleSchema,
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  bio: z.string().nullable(),
  coin_balance: z.number(),
  is_active: z.boolean(),
  email_verified: z.boolean(),
  two_factor_enabled: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: userRoleSchema.default('reader'),
  display_name: z.string().max(100).optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  display_name: z.string().max(100).nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  is_active: z.boolean().optional(),
  role: userRoleSchema.optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Genre schemas
export const genreSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});

export type Genre = z.infer<typeof genreSchema>;

export const createGenreInputSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional()
});

export type CreateGenreInput = z.infer<typeof createGenreInputSchema>;

// Novel schemas
export const novelSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  cover_image_url: z.string().nullable(),
  author_id: z.number(),
  status: novelStatusSchema,
  genre_id: z.number(),
  total_chapters: z.number().int(),
  total_views: z.number().int(),
  total_likes: z.number().int(),
  average_rating: z.number().nullable(),
  is_featured: z.boolean(),
  is_premium: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Novel = z.infer<typeof novelSchema>;

export const createNovelInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().max(5000).nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  author_id: z.number(),
  genre_id: z.number(),
  status: novelStatusSchema.default('draft'),
  is_premium: z.boolean().default(false)
});

export type CreateNovelInput = z.infer<typeof createNovelInputSchema>;

export const updateNovelInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  status: novelStatusSchema.optional(),
  genre_id: z.number().optional(),
  is_featured: z.boolean().optional(),
  is_premium: z.boolean().optional()
});

export type UpdateNovelInput = z.infer<typeof updateNovelInputSchema>;

// Chapter schemas
export const chapterSchema = z.object({
  id: z.number(),
  novel_id: z.number(),
  chapter_number: z.number().int(),
  title: z.string(),
  content: z.string(),
  word_count: z.number().int(),
  status: chapterStatusSchema,
  is_premium: z.boolean(),
  coin_cost: z.number(),
  views: z.number().int(),
  likes: z.number().int(),
  published_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Chapter = z.infer<typeof chapterSchema>;

export const createChapterInputSchema = z.object({
  novel_id: z.number(),
  chapter_number: z.number().int().positive(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  status: chapterStatusSchema.default('draft'),
  is_premium: z.boolean().default(false),
  coin_cost: z.number().nonnegative().default(0)
});

export type CreateChapterInput = z.infer<typeof createChapterInputSchema>;

export const updateChapterInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  status: chapterStatusSchema.optional(),
  is_premium: z.boolean().optional(),
  coin_cost: z.number().nonnegative().optional()
});

export type UpdateChapterInput = z.infer<typeof updateChapterInputSchema>;

// Transaction schemas
export const transactionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  type: transactionTypeSchema,
  amount: z.number(),
  coin_amount: z.number(),
  status: transactionStatusSchema,
  reference_id: z.string().nullable(),
  novel_id: z.number().nullable(),
  chapter_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

export const createTransactionInputSchema = z.object({
  user_id: z.number(),
  type: transactionTypeSchema,
  amount: z.number().positive(),
  coin_amount: z.number().positive(),
  reference_id: z.string().nullable().optional(),
  novel_id: z.number().nullable().optional(),
  chapter_id: z.number().nullable().optional()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Rating schemas
export const ratingSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  novel_id: z.number(),
  rating: z.number().int().min(1).max(5),
  review: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Rating = z.infer<typeof ratingSchema>;

export const createRatingInputSchema = z.object({
  user_id: z.number(),
  novel_id: z.number(),
  rating: z.number().int().min(1).max(5),
  review: z.string().max(2000).nullable().optional()
});

export type CreateRatingInput = z.infer<typeof createRatingInputSchema>;

// Comment schemas
export const commentSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  chapter_id: z.number(),
  parent_id: z.number().nullable(),
  content: z.string(),
  likes: z.number().int(),
  is_deleted: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Comment = z.infer<typeof commentSchema>;

export const createCommentInputSchema = z.object({
  user_id: z.number(),
  chapter_id: z.number(),
  parent_id: z.number().nullable().optional(),
  content: z.string().min(1).max(1000)
});

export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;

// Follow schemas
export const followSchema = z.object({
  id: z.number(),
  follower_id: z.number(),
  following_id: z.number(),
  created_at: z.coerce.date()
});

export type Follow = z.infer<typeof followSchema>;

export const createFollowInputSchema = z.object({
  follower_id: z.number(),
  following_id: z.number()
});

export type CreateFollowInput = z.infer<typeof createFollowInputSchema>;

// Reading progress schemas
export const readingProgressSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  novel_id: z.number(),
  chapter_id: z.number(),
  progress_percentage: z.number().min(0).max(100),
  last_read_at: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ReadingProgress = z.infer<typeof readingProgressSchema>;

export const updateReadingProgressInputSchema = z.object({
  user_id: z.number(),
  novel_id: z.number(),
  chapter_id: z.number(),
  progress_percentage: z.number().min(0).max(100)
});

export type UpdateReadingProgressInput = z.infer<typeof updateReadingProgressInputSchema>;

// Notification schemas
export const notificationSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  reference_id: z.number().nullable(),
  is_read: z.boolean(),
  created_at: z.coerce.date()
});

export type Notification = z.infer<typeof notificationSchema>;

export const createNotificationInputSchema = z.object({
  user_id: z.number(),
  type: notificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(500),
  reference_id: z.number().nullable().optional()
});

export type CreateNotificationInput = z.infer<typeof createNotificationInputSchema>;

// Library schemas (user's personal library)
export const librarySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  novel_id: z.number(),
  is_favorite: z.boolean(),
  added_at: z.coerce.date()
});

export type Library = z.infer<typeof librarySchema>;

export const addToLibraryInputSchema = z.object({
  user_id: z.number(),
  novel_id: z.number(),
  is_favorite: z.boolean().default(false)
});

export type AddToLibraryInput = z.infer<typeof addToLibraryInputSchema>;

// Admin dashboard statistics schema
export const dashboardStatsSchema = z.object({
  total_users: z.number().int(),
  total_novels: z.number().int(),
  total_chapters: z.number().int(),
  total_transactions: z.number().int(),
  total_revenue: z.number(),
  active_users_today: z.number().int(),
  new_users_today: z.number().int(),
  chapters_published_today: z.number().int()
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

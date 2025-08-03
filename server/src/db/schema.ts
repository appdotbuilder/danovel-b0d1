
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['visitor', 'reader', 'writer', 'admin']);
export const novelStatusEnum = pgEnum('novel_status', ['draft', 'ongoing', 'completed', 'hiatus', 'dropped']);
export const chapterStatusEnum = pgEnum('chapter_status', ['draft', 'published', 'scheduled']);
export const transactionTypeEnum = pgEnum('transaction_type', ['coin_purchase', 'chapter_unlock', 'writer_payout']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed', 'refunded']);
export const notificationTypeEnum = pgEnum('notification_type', ['new_chapter', 'writer_follow', 'comment_reply', 'system']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('reader'),
  display_name: text('display_name'),
  avatar_url: text('avatar_url'),
  bio: text('bio'),
  coin_balance: numeric('coin_balance', { precision: 10, scale: 2 }).notNull().default('0'),
  is_active: boolean('is_active').notNull().default(true),
  email_verified: boolean('email_verified').notNull().default(false),
  two_factor_enabled: boolean('two_factor_enabled').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Genres table
export const genresTable = pgTable('genres', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Novels table
export const novelsTable = pgTable('novels', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  cover_image_url: text('cover_image_url'),
  author_id: integer('author_id').notNull().references(() => usersTable.id),
  status: novelStatusEnum('status').notNull().default('draft'),
  genre_id: integer('genre_id').notNull().references(() => genresTable.id),
  total_chapters: integer('total_chapters').notNull().default(0),
  total_views: integer('total_views').notNull().default(0),
  total_likes: integer('total_likes').notNull().default(0),
  average_rating: numeric('average_rating', { precision: 3, scale: 2 }),
  is_featured: boolean('is_featured').notNull().default(false),
  is_premium: boolean('is_premium').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Chapters table
export const chaptersTable = pgTable('chapters', {
  id: serial('id').primaryKey(),
  novel_id: integer('novel_id').notNull().references(() => novelsTable.id),
  chapter_number: integer('chapter_number').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  word_count: integer('word_count').notNull().default(0),
  status: chapterStatusEnum('status').notNull().default('draft'),
  is_premium: boolean('is_premium').notNull().default(false),
  coin_cost: numeric('coin_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  views: integer('views').notNull().default(0),
  likes: integer('likes').notNull().default(0),
  published_at: timestamp('published_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Comments table - handle self-reference properly
export const commentsTable = pgTable('comments', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  chapter_id: integer('chapter_id').notNull().references(() => chaptersTable.id),
  parent_id: integer('parent_id'),
  content: text('content').notNull(),
  likes: integer('likes').notNull().default(0),
  is_deleted: boolean('is_deleted').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Transactions table
export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  type: transactionTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  coin_amount: numeric('coin_amount', { precision: 10, scale: 2 }).notNull(),
  status: transactionStatusEnum('status').notNull().default('pending'),
  reference_id: text('reference_id'),
  novel_id: integer('novel_id').references(() => novelsTable.id),
  chapter_id: integer('chapter_id').references(() => chaptersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Ratings table
export const ratingsTable = pgTable('ratings', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  novel_id: integer('novel_id').notNull().references(() => novelsTable.id),
  rating: integer('rating').notNull(),
  review: text('review'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Follows table
export const followsTable = pgTable('follows', {
  id: serial('id').primaryKey(),
  follower_id: integer('follower_id').notNull().references(() => usersTable.id),
  following_id: integer('following_id').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Reading progress table
export const readingProgressTable = pgTable('reading_progress', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  novel_id: integer('novel_id').notNull().references(() => novelsTable.id),
  chapter_id: integer('chapter_id').notNull().references(() => chaptersTable.id),
  progress_percentage: numeric('progress_percentage', { precision: 5, scale: 2 }).notNull().default('0'),
  last_read_at: timestamp('last_read_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Notifications table
export const notificationsTable = pgTable('notifications', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  reference_id: integer('reference_id'),
  is_read: boolean('is_read').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Library table (user's personal library)
export const libraryTable = pgTable('library', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  novel_id: integer('novel_id').notNull().references(() => novelsTable.id),
  is_favorite: boolean('is_favorite').notNull().default(false),
  added_at: timestamp('added_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  novels: many(novelsTable),
  transactions: many(transactionsTable),
  ratings: many(ratingsTable),
  comments: many(commentsTable),
  followers: many(followsTable, { relationName: 'followers' }),
  following: many(followsTable, { relationName: 'following' }),
  readingProgress: many(readingProgressTable),
  notifications: many(notificationsTable),
  library: many(libraryTable)
}));

export const novelsRelations = relations(novelsTable, ({ one, many }) => ({
  author: one(usersTable, {
    fields: [novelsTable.author_id],
    references: [usersTable.id]
  }),
  genre: one(genresTable, {
    fields: [novelsTable.genre_id],
    references: [genresTable.id]
  }),
  chapters: many(chaptersTable),
  ratings: many(ratingsTable),
  transactions: many(transactionsTable),
  readingProgress: many(readingProgressTable),
  library: many(libraryTable)
}));

export const chaptersRelations = relations(chaptersTable, ({ one, many }) => ({
  novel: one(novelsTable, {
    fields: [chaptersTable.novel_id],
    references: [novelsTable.id]
  }),
  comments: many(commentsTable),
  transactions: many(transactionsTable),
  readingProgress: many(readingProgressTable)
}));

export const genresRelations = relations(genresTable, ({ many }) => ({
  novels: many(novelsTable)
}));

export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [transactionsTable.user_id],
    references: [usersTable.id]
  }),
  novel: one(novelsTable, {
    fields: [transactionsTable.novel_id],
    references: [novelsTable.id]
  }),
  chapter: one(chaptersTable, {
    fields: [transactionsTable.chapter_id],
    references: [chaptersTable.id]
  })
}));

export const ratingsRelations = relations(ratingsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [ratingsTable.user_id],
    references: [usersTable.id]
  }),
  novel: one(novelsTable, {
    fields: [ratingsTable.novel_id],
    references: [novelsTable.id]
  })
}));

export const commentsRelations = relations(commentsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [commentsTable.user_id],
    references: [usersTable.id]
  }),
  chapter: one(chaptersTable, {
    fields: [commentsTable.chapter_id],
    references: [chaptersTable.id]
  }),
  parent: one(commentsTable, {
    fields: [commentsTable.parent_id],
    references: [commentsTable.id],
    relationName: 'parent'
  }),
  replies: many(commentsTable, { relationName: 'parent' })
}));

export const followsRelations = relations(followsTable, ({ one }) => ({
  follower: one(usersTable, {
    fields: [followsTable.follower_id],
    references: [usersTable.id],
    relationName: 'followers'
  }),
  following: one(usersTable, {
    fields: [followsTable.following_id],
    references: [usersTable.id],
    relationName: 'following'
  })
}));

export const readingProgressRelations = relations(readingProgressTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [readingProgressTable.user_id],
    references: [usersTable.id]
  }),
  novel: one(novelsTable, {
    fields: [readingProgressTable.novel_id],
    references: [novelsTable.id]
  }),
  chapter: one(chaptersTable, {
    fields: [readingProgressTable.chapter_id],
    references: [chaptersTable.id]
  })
}));

export const notificationsRelations = relations(notificationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [notificationsTable.user_id],
    references: [usersTable.id]
  })
}));

export const libraryRelations = relations(libraryTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [libraryTable.user_id],
    references: [usersTable.id]
  }),
  novel: one(novelsTable, {
    fields: [libraryTable.novel_id],
    references: [novelsTable.id]
  })
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  genres: genresTable,
  novels: novelsTable,
  chapters: chaptersTable,
  transactions: transactionsTable,
  ratings: ratingsTable,
  comments: commentsTable,
  follows: followsTable,
  readingProgress: readingProgressTable,
  notifications: notificationsTable,
  library: libraryTable
};

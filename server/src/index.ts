
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import {
  createUserInputSchema,
  updateUserInputSchema,
  createGenreInputSchema,
  createNovelInputSchema,
  updateNovelInputSchema,
  createChapterInputSchema,
  updateChapterInputSchema,
  createTransactionInputSchema,
  createRatingInputSchema,
  createCommentInputSchema,
  createFollowInputSchema,
  updateReadingProgressInputSchema,
  createNotificationInputSchema,
  addToLibraryInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { updateUser } from './handlers/update_user';
import { createGenre } from './handlers/create_genre';
import { getGenres } from './handlers/get_genres';
import { createNovel } from './handlers/create_novel';
import { getNovels } from './handlers/get_novels';
import { updateNovel } from './handlers/update_novel';
import { createChapter } from './handlers/create_chapter';
import { getChapters } from './handlers/get_chapters';
import { updateChapter } from './handlers/update_chapter';
import { createTransaction } from './handlers/create_transaction';
import { getTransactions } from './handlers/get_transactions';
import { createRating } from './handlers/create_rating';
import { getRatings } from './handlers/get_ratings';
import { createComment } from './handlers/create_comment';
import { getComments } from './handlers/get_comments';
import { createFollow } from './handlers/create_follow';
import { updateReadingProgress } from './handlers/update_reading_progress';
import { getReadingProgress } from './handlers/get_reading_progress';
import { createNotification } from './handlers/create_notification';
import { getNotifications } from './handlers/get_notifications';
import { addToLibrary } from './handlers/add_to_library';
import { getLibrary } from './handlers/get_library';
import { getDashboardStats } from './handlers/get_dashboard_stats';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure
    .query(() => getUsers()),
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  // Genre management routes
  createGenre: publicProcedure
    .input(createGenreInputSchema)
    .mutation(({ input }) => createGenre(input)),
  getGenres: publicProcedure
    .query(() => getGenres()),

  // Novel management routes
  createNovel: publicProcedure
    .input(createNovelInputSchema)
    .mutation(({ input }) => createNovel(input)),
  getNovels: publicProcedure
    .query(() => getNovels()),
  updateNovel: publicProcedure
    .input(updateNovelInputSchema)
    .mutation(({ input }) => updateNovel(input)),

  // Chapter management routes
  createChapter: publicProcedure
    .input(createChapterInputSchema)
    .mutation(({ input }) => createChapter(input)),
  getChapters: publicProcedure
    .input(z.object({ novelId: z.number() }))
    .query(({ input }) => getChapters(input.novelId)),
  updateChapter: publicProcedure
    .input(updateChapterInputSchema)
    .mutation(({ input }) => updateChapter(input)),

  // Transaction routes
  createTransaction: publicProcedure
    .input(createTransactionInputSchema)
    .mutation(({ input }) => createTransaction(input)),
  getTransactions: publicProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(({ input }) => getTransactions(input.userId)),

  // Rating and review routes
  createRating: publicProcedure
    .input(createRatingInputSchema)
    .mutation(({ input }) => createRating(input)),
  getRatings: publicProcedure
    .input(z.object({ novelId: z.number() }))
    .query(({ input }) => getRatings(input.novelId)),

  // Comment routes
  createComment: publicProcedure
    .input(createCommentInputSchema)
    .mutation(({ input }) => createComment(input)),
  getComments: publicProcedure
    .input(z.object({ chapterId: z.number() }))
    .query(({ input }) => getComments(input.chapterId)),

  // Follow routes
  createFollow: publicProcedure
    .input(createFollowInputSchema)
    .mutation(({ input }) => createFollow(input)),

  // Reading progress routes
  updateReadingProgress: publicProcedure
    .input(updateReadingProgressInputSchema)
    .mutation(({ input }) => updateReadingProgress(input)),
  getReadingProgress: publicProcedure
    .input(z.object({ userId: z.number(), novelId: z.number().optional() }))
    .query(({ input }) => getReadingProgress(input.userId, input.novelId)),

  // Notification routes
  createNotification: publicProcedure
    .input(createNotificationInputSchema)
    .mutation(({ input }) => createNotification(input)),
  getNotifications: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getNotifications(input.userId)),

  // Library routes
  addToLibrary: publicProcedure
    .input(addToLibraryInputSchema)
    .mutation(({ input }) => addToLibrary(input)),
  getLibrary: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getLibrary(input.userId)),

  // Admin dashboard routes
  getDashboardStats: publicProcedure
    .query(() => getDashboardStats()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`DANOVEL TRPC server listening at port: ${port}`);
}

start();

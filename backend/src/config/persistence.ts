import { env } from './env';

export const initializePersistence = (): void => {
  if (env.MONGODB_URI) {
    console.info(
      '[Persistence] MONGODB_URI detected. MongoDB integration is not enabled yet; using in-memory storage.'
    );
    return;
  }

  console.info('[Persistence] Using in-memory storage (no MONGODB_URI configured).');
};

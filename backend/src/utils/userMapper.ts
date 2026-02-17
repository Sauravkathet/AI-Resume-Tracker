import type { PublicUser, UserRecord } from '../types/models';

export const toPublicUser = (user: UserRecord, token?: string): PublicUser => {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    ...(token ? { token } : {}),
  };
};

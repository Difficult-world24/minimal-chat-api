import { Prisma } from '@prisma/client';

export const userInclude: Prisma.UserInclude = {
  Friends: {
    include: {
      friend: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  },
};

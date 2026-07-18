import bcrypt from 'bcrypt';

import {
  USER_ROLES,
  USER_STATUSES,
} from '../constants/user.constants';

import {
  connectToDatabase,
  disconnectFromDatabase,
} from '../config/database';

import { environment } from '../config/environment';
import { logger } from '../config/logger';
import { User } from '../models/user.model';

const seedAdmin =
  async (): Promise<void> => {
    const firstName =
      environment
        .ADMIN_SEED_FIRST_NAME;

    const lastName =
      environment
        .ADMIN_SEED_LAST_NAME;

    const email =
      environment
        .ADMIN_SEED_EMAIL
        ?.toLowerCase();

    const password =
      environment
        .ADMIN_SEED_PASSWORD;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password
    ) {
      throw new Error(
        'ADMIN_SEED_FIRST_NAME, ADMIN_SEED_LAST_NAME, ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required',
      );
    }

    await connectToDatabase();

    const passwordHash =
      await bcrypt.hash(
        password,

        environment
          .BCRYPT_ROUNDS,
      );

    const admin =
      await User
        .findOneAndUpdate(
          {
            email,
          },

          {
            $set: {
              firstName,
              lastName,
              passwordHash,

              role:
                USER_ROLES.ADMIN,

              status:
                USER_STATUSES.ACTIVE,

              emailVerified:
                true,
            },

            $setOnInsert: {
              tokenVersion:
                0,
            },
          },

          {
            upsert:
              true,

            new:
              true,

            runValidators:
              true,
          },
        );

    logger.info(
      {
        adminId:
          admin.id,

        email:
          admin.email,
      },

      'Admin user seeded successfully',
    );

    await disconnectFromDatabase();
  };

void seedAdmin()
  .catch(
    async (
      error,
    ) => {
      logger.fatal(
        {
          err:
            error,
        },

        'Admin seeding failed',
      );

      await disconnectFromDatabase();

      process.exit(1);
    },
  );
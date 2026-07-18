import jwt, {
  type JwtPayload,
  type SignOptions,
} from 'jsonwebtoken';

import {
  Types,
} from 'mongoose';

import {
  TOKEN_TYPES,
} from '../constants/auth.constants';

import {
  USER_STATUSES,
} from '../constants/user.constants';

import {
  environment,
} from '../config/environment';

import {
  AppError,
} from '../errors/AppError';

import {
  RefreshSession,
} from '../models/refreshSession.model';

import {
  User,
  type UserDocument,
} from '../models/user.model';

import type {
  AccessTokenPayload,
  PasswordResetTokenPayload,
  RefreshTokenPayload,
  SessionMetadata,
} from '../types/auth.types';

import {
  hashToken,
  safeHashEquals,
} from '../utils/hashValue';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;

  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

const commonSignOptions: Pick<
  SignOptions,
  'issuer' | 'audience'
> = {
  issuer:
    environment.JWT_ISSUER,

  audience:
    environment.JWT_AUDIENCE,
};

/**
 * Converts an environment expiry string such as:
 *
 * 15m
 * 30d
 * 10m
 *
 * into the type expected by jsonwebtoken.
 */
const toJwtExpiresIn = (
  value: string,
): SignOptions['expiresIn'] => {
  return value as SignOptions['expiresIn'];
};

const getExpirationDate = (
  token: string,
): Date => {
  const decoded =
    jwt.decode(token);

  if (
    typeof decoded === 'string' ||
    !decoded?.exp
  ) {
    throw new AppError(
      'Token expiration could not be determined',
      500,
      'TOKEN_CONFIGURATION_ERROR',
    );
  }

  return new Date(
    decoded.exp * 1000,
  );
};

const signAccessToken = (
  user: UserDocument,
  sessionId: string,
): string => {
  return jwt.sign(
    {
      sid:
        sessionId,

      type:
        TOKEN_TYPES.ACCESS,

      role:
        user.role,

      tokenVersion:
        user.tokenVersion,
    },

    environment.JWT_ACCESS_SECRET,

    {
      ...commonSignOptions,

      subject:
        user._id.toString(),

      expiresIn:
        toJwtExpiresIn(
          environment.JWT_ACCESS_EXPIRES_IN,
        ),
    },
  );
};

const signRefreshToken = (
  user: UserDocument,
  sessionId: string,
): string => {
  return jwt.sign(
    {
      sid:
        sessionId,

      type:
        TOKEN_TYPES.REFRESH,

      tokenVersion:
        user.tokenVersion,
    },

    environment.JWT_REFRESH_SECRET,

    {
      ...commonSignOptions,

      subject:
        user._id.toString(),

      expiresIn:
        toJwtExpiresIn(
          environment.JWT_REFRESH_EXPIRES_IN,
        ),
    },
  );
};

const assertPayload = <
  T extends JwtPayload,
>(
  decoded: string | JwtPayload,
  expectedType: string,
): T => {
  if (
    typeof decoded === 'string' ||
    !decoded.sub ||
    decoded.type !== expectedType
  ) {
    throw new AppError(
      'The supplied token is invalid',
      401,
      'INVALID_TOKEN',
    );
  }

  return decoded as T;
};

export const verifyAccessToken = (
  token: string,
): AccessTokenPayload => {
  try {
    const decoded =
      jwt.verify(
        token,

        environment.JWT_ACCESS_SECRET,

        {
          issuer:
            environment.JWT_ISSUER,

          audience:
            environment.JWT_AUDIENCE,
        },
      );

    const payload =
      assertPayload<AccessTokenPayload>(
        decoded,
        TOKEN_TYPES.ACCESS,
      );

    if (
      !payload.sid ||
      typeof payload.tokenVersion !==
        'number' ||
      !payload.role
    ) {
      throw new AppError(
        'The supplied access token is invalid',
        401,
        'INVALID_ACCESS_TOKEN',
      );
    }

    return payload;
  } catch (error) {
    if (
      error instanceof AppError
    ) {
      throw error;
    }

    if (
      error instanceof
      jwt.TokenExpiredError
    ) {
      throw new AppError(
        'The access token has expired',
        401,
        'ACCESS_TOKEN_EXPIRED',
      );
    }

    throw new AppError(
      'The access token is invalid',
      401,
      'INVALID_ACCESS_TOKEN',
    );
  }
};

const verifyRefreshToken = (
  token: string,
): RefreshTokenPayload => {
  try {
    const decoded =
      jwt.verify(
        token,

        environment.JWT_REFRESH_SECRET,

        {
          issuer:
            environment.JWT_ISSUER,

          audience:
            environment.JWT_AUDIENCE,
        },
      );

    const payload =
      assertPayload<RefreshTokenPayload>(
        decoded,
        TOKEN_TYPES.REFRESH,
      );

    if (
      !payload.sid ||
      typeof payload.tokenVersion !==
        'number'
    ) {
      throw new AppError(
        'The refresh token is invalid',
        401,
        'INVALID_REFRESH_TOKEN',
      );
    }

    return payload;
  } catch (error) {
    if (
      error instanceof AppError
    ) {
      throw error;
    }

    if (
      error instanceof
      jwt.TokenExpiredError
    ) {
      throw new AppError(
        'The refresh token has expired',
        401,
        'REFRESH_TOKEN_EXPIRED',
      );
    }

    throw new AppError(
      'The refresh token is invalid',
      401,
      'INVALID_REFRESH_TOKEN',
    );
  }
};

export const createTokenPair =
  async (
    user: UserDocument,

    metadata:
      SessionMetadata,
  ): Promise<TokenPair> => {
    const sessionId =
      new Types.ObjectId();

    const refreshToken =
      signRefreshToken(
        user,
        sessionId.toString(),
      );

    const accessToken =
      signAccessToken(
        user,
        sessionId.toString(),
      );

    const refreshTokenExpiresAt =
      getExpirationDate(
        refreshToken,
      );

    await RefreshSession.create({
      _id:
        sessionId,

      userId:
        user._id,

      tokenHash:
        hashToken(
          refreshToken,
        ),

      ipAddress:
        metadata.ipAddress,

      userAgent:
        metadata.userAgent,

      lastUsedAt:
        new Date(),

      expiresAt:
        refreshTokenExpiresAt,
    });

    return {
      accessToken,
      refreshToken,

      accessTokenExpiresAt:
        getExpirationDate(
          accessToken,
        ),

      refreshTokenExpiresAt,
    };
  };

export const rotateRefreshToken =
  async (
    currentRefreshToken:
      string,

    metadata:
      SessionMetadata,
  ): Promise<{
    user: UserDocument;
    tokens: TokenPair;
  }> => {
    const payload =
      verifyRefreshToken(
        currentRefreshToken,
      );

    const session =
      await RefreshSession
        .findById(
          payload.sid,
        )
        .select(
          '+tokenHash',
        );

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <=
        Date.now()
    ) {
      throw new AppError(
        'The refresh session is no longer active',
        401,
        'REFRESH_SESSION_INACTIVE',
      );
    }

    const suppliedTokenHash =
      hashToken(
        currentRefreshToken,
      );

    if (
      !safeHashEquals(
        session.tokenHash,
        suppliedTokenHash,
      )
    ) {
      session.revokedAt =
        new Date();

      await session.save();

      throw new AppError(
        'Refresh token reuse was detected. Please sign in again.',
        401,
        'REFRESH_TOKEN_REUSE_DETECTED',
      );
    }

    const user =
      await User
        .findById(
          payload.sub,
        )
        .select(
          '+tokenVersion',
        );

    if (
      !user ||
      user.status !==
        USER_STATUSES.ACTIVE ||
      !user.emailVerified ||
      user.tokenVersion !==
        payload.tokenVersion
    ) {
      session.revokedAt =
        new Date();

      await session.save();

      throw new AppError(
        'The user session is no longer valid',
        401,
        'USER_SESSION_INVALID',
      );
    }

    const newRefreshToken =
      signRefreshToken(
        user,
        session.id,
      );

    const newAccessToken =
      signAccessToken(
        user,
        session.id,
      );

    const refreshTokenExpiresAt =
      getExpirationDate(
        newRefreshToken,
      );

    session.tokenHash =
      hashToken(
        newRefreshToken,
      );

    session.lastUsedAt =
      new Date();

    session.expiresAt =
      refreshTokenExpiresAt;

    session.ipAddress =
      metadata.ipAddress ??
      session.ipAddress;

    session.userAgent =
      metadata.userAgent ??
      session.userAgent;

    await session.save();

    return {
      user,

      tokens: {
        accessToken:
          newAccessToken,

        refreshToken:
          newRefreshToken,

        accessTokenExpiresAt:
          getExpirationDate(
            newAccessToken,
          ),

        refreshTokenExpiresAt,
      },
    };
  };

export const createPasswordResetToken = (
  user: UserDocument,
): string => {
  return jwt.sign(
    {
      type:
        TOKEN_TYPES.PASSWORD_RESET,

      tokenVersion:
        user.tokenVersion,
    },

    environment.JWT_PASSWORD_RESET_SECRET,

    {
      ...commonSignOptions,

      subject:
        user._id.toString(),

      expiresIn:
        toJwtExpiresIn(
          environment
            .JWT_PASSWORD_RESET_EXPIRES_IN,
        ),
    },
  );
};

export const verifyPasswordResetToken = (
  token: string,
): PasswordResetTokenPayload => {
  try {
    const decoded =
      jwt.verify(
        token,

        environment
          .JWT_PASSWORD_RESET_SECRET,

        {
          issuer:
            environment.JWT_ISSUER,

          audience:
            environment.JWT_AUDIENCE,
        },
      );

    const payload =
      assertPayload<PasswordResetTokenPayload>(
        decoded,
        TOKEN_TYPES.PASSWORD_RESET,
      );

    if (
      typeof payload.tokenVersion !==
      'number'
    ) {
      throw new AppError(
        'The password reset token is invalid',
        401,
        'INVALID_PASSWORD_RESET_TOKEN',
      );
    }

    return payload;
  } catch (error) {
    if (
      error instanceof AppError
    ) {
      throw error;
    }

    if (
      error instanceof
      jwt.TokenExpiredError
    ) {
      throw new AppError(
        'The password reset token has expired',
        401,
        'PASSWORD_RESET_TOKEN_EXPIRED',
      );
    }

    throw new AppError(
      'The password reset token is invalid',
      401,
      'INVALID_PASSWORD_RESET_TOKEN',
    );
  }
};

export const revokeSession =
  async (
    sessionId: string,
    userId: string,
  ): Promise<void> => {
    await RefreshSession.updateOne(
      {
        _id:
          sessionId,

        userId,

        revokedAt: {
          $exists:
            false,
        },
      },

      {
        $set: {
          revokedAt:
            new Date(),
        },
      },
    );
  };

export const revokeAllUserSessions =
  async (
    userId: string,
  ): Promise<void> => {
    await RefreshSession.updateMany(
      {
        userId,

        revokedAt: {
          $exists:
            false,
        },
      },

      {
        $set: {
          revokedAt:
            new Date(),
        },
      },
    );
  };
import {
  Schema,
  model,
  type Types,
} from 'mongoose';

export interface IRefreshSession {
  userId: Types.ObjectId;
  tokenHash: string;

  ipAddress?: string;
  userAgent?: string;

  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const refreshSessionSchema =
  new Schema<IRefreshSession>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },

      tokenHash: {
        type: String,
        required: true,
        select: false,
      },

      ipAddress: {
        type: String,
        trim: true,
      },

      userAgent: {
        type: String,
        trim: true,
        maxlength: 500,
      },

      lastUsedAt: {
        type: Date,
        default: Date.now,
        required: true,
      },

      expiresAt: {
        type: Date,
        required: true,
      },

      revokedAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    },
  );

refreshSessionSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  },
);

refreshSessionSchema.index({
  userId: 1,
  revokedAt: 1,
});

export const RefreshSession =
  model<IRefreshSession>(
    'RefreshSession',
    refreshSessionSchema,
  );
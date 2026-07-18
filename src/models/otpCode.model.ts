import {
  Schema,
  model,
} from 'mongoose';

import {
  OTP_PURPOSES,
  type OtpPurpose,
} from '../constants/auth.constants';

export interface IOtpCode {
  email: string;
  purpose: OtpPurpose;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const otpCodeSchema = new Schema<IOtpCode>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    purpose: {
      type: String,
      enum: Object.values(OTP_PURPOSES),
      required: true,
    },

    codeHash: {
      type: String,
      required: true,
      select: false,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

otpCodeSchema.index(
  {
    email: 1,
    purpose: 1,
  },
  {
    unique: true,
  },
);

otpCodeSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  },
);

export const OtpCode = model<IOtpCode>(
  'OtpCode',
  otpCodeSchema,
);
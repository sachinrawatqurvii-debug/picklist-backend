import mongoose from 'mongoose';

const qrWithUrlSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      required: true,
    },
    sessionId: {
      type: Number,
      required: true,
    },
    qrId: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const QrWithUrl = mongoose.model('QrWithUrl', qrWithUrlSchema);

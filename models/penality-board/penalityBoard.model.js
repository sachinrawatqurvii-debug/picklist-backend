import mongoose from 'mongoose';
const penalityBoardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    mistake: {
      type: String,
      required: true,
    },
    mistake_image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const PenalityBoard = mongoose.model('PenalityBoard', penalityBoardSchema);
export default PenalityBoard;

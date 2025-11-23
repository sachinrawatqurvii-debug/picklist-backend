import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ["new", "processed", "completed", "rejected"],
            required: true,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
        processBy: {
            type: Number,
            required: true,
        },

    },
    { _id: false }
);

const claimSchema = new mongoose.Schema(
    {
        channel: { type: String, required: true },
        tracking_id: { type: String, required: true, unique: true },
        category: { type: String, required: true },
        employee_id: { type: Number, required: true },

        // CURRENT STATUS
        status: {
            type: String,
            enum: ["new", "processed", "completed", "rejected"],
            default: "new",
        },

        // STATUS HISTORY
        statusHistory: {
            type: [statusSchema],
            default: [{ status: "new" }],
        }
    },
    { timestamps: true }
);

export const Claim = mongoose.model("Claim", claimSchema);

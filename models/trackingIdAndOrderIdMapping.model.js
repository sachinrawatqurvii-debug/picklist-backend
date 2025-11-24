import mongoose from "mongoose";

const TrackingSchema = new mongoose.Schema(
    {
        tracking_id: { type: String, required: true },
        order_id: { type: Number, required: true }
    },
    { timestamps: true }
);

// Unique pair index
TrackingSchema.index({ tracking_id: 1, order_id: 1 }, { unique: true });

export const TrackingAndOrderIdMapping =
    mongoose.model("TrackingAndOrderIdMapping", TrackingSchema);

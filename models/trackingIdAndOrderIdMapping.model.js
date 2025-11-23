import mongoose from "mongoose";
const trackingIdAndOrderIdMappingSchema = new mongoose.Schema({
    tracking_id: {
        type: String,
        required: true,
    },
    order_id: {
        type: Number,
        required: true,
    }
},
    { timestamps: true }
);

export const TrackingAndOrderIdMapping = mongoose.model("TrackingAndOrderIdMapping", trackingIdAndOrderIdMappingSchema);
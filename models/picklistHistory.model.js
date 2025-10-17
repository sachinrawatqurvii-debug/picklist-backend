import mongoose from "mongoose";

const picklistHistorySchema = new mongoose.Schema({
    channel: {
        type: String,
        required: true,
    },
    picklist_id: {
        type: Number,
        required: true
    },
    sync_id: {
        type: Number,
        required: true
    },
    stock_updated: {
        type: Number,
    }
}, { timestamps: true });

const PicklistHistory = mongoose.model("PicklistHistory", picklistHistorySchema);
export { PicklistHistory }
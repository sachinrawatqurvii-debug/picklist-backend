import mongoose from "mongoose";

const picklistAlterSchema = new mongoose.Schema({
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
        default: 0
    },
    status: {
        type: String,
        default: "pending"
    }
}, { timestamps: true });

const PicklistAlteration = mongoose.model("PicklistAlteration", picklistAlterSchema);
export { PicklistAlteration }
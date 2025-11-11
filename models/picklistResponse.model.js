import mongoose from "mongoose";

const picklistResponseSchema = new mongoose.Schema({
    channel: {
        type: String,
        required: true
    },
    picklist_id: {
        type: Number,
        required: true
    },
    style_number: {
        type: Number,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    employee_id: {
        type: Number,
        required: true
    },
    scanned_timestamp: {
        type: Date,
    },
    color: {
        type: String,
    },
    isSplit: {
        type: String,
        required: true
    },
    parentStyle: {
        type: Number,
    },
    rackSpace: {
        type: String,
        required: true,
    },
    realated_stock: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }


}, { timestamps: true });

const PicklistResponse = mongoose.model("PicklistResponse", picklistResponseSchema);
export { PicklistResponse }
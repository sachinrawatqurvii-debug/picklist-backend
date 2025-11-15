import mongoose from "mongoose";

const secondAttempSchema = new mongoose.Schema(({
    picklist_id: {
        type: Number,
        required: true,
    },
    employee_id: {
        type: Number,
        required: true,
    },
    channel: {
        type: String,
        required: true
    },
    records: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    first_attempt_status: {
        type: String,
    },
    second_attemp_status: {
        type: String,
    },
    picklist_response_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    }
}), { timestamps: true });

const SecondAttempt = mongoose.model("SecondAttemp", secondAttempSchema);
export { SecondAttempt };
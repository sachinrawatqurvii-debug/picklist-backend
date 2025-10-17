import mongoose from "mongoose";

const picklistSchema = new mongoose.Schema({
    channel: {
        type: String,
        required: true,
    },
    style_number: {
        type: Number,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    picklist_id: {
        type: Number,
        required: true,
    },
    brand: {
        type: String,
        required: true
    },
    color: {
        type: String
    },
    isSplit: {
        type: String,
        required: true
    },
    parentStyle: {
        type: Number,
    }

},
    { timestamps: true }
)

const Picklist = mongoose.model("Picklist", picklistSchema);

export { Picklist }
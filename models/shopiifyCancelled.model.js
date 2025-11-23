import mongoose from "mongoose";
const shopifyCancelledOrderSchema = new mongoose.Schema({
    employee_id: {
        type: Number,
        required: true,
    },
    channel: {
        type: String,
        default: "Shopify"
    },
    order_id: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "cancelled"
    }
},
    { timestamps: true }
)

export const ShopifyCancelledOrders = mongoose.model("ShopifyCancelledOrders", shopifyCancelledOrderSchema);
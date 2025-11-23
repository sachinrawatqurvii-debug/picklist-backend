import { ShopifyCancelledOrders } from "../models/shopiifyCancelled.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// =====================================================
// 1️⃣ Add Cancelled Order
// =====================================================
export const addCancelledOrder = async (req, res, next) => {
    try {
        const { employee_id, order_id, status, channel } = req.body;

        // Validation
        if (!employee_id || typeof employee_id !== "number") {
            throw new ApiError(400, "employee_id is required and must be a number");
        }
        if (!order_id) {
            throw new ApiError(400, "order_id is required");
        }

        const newOrder = await ShopifyCancelledOrders.create({
            employee_id,
            order_id,
            status: status || "cancelled",
            channel: channel || "Shopify"
        });

        return res
            .status(201)
            .json(new ApiResponse(201, newOrder, "Cancelled order added successfully"));

    } catch (error) {
        next(error);
    }
};


// =====================================================
// 2️⃣ Get Cancelled Orders (Filter + Pagination)
// =====================================================
export const getCancelledOrders = async (req, res, next) => {
    try {
        let { page = 1, limit = 10, order_id } = req.query;

        page = Number(page);
        limit = Number(limit);

        if (isNaN(page) || page <= 0) {
            throw new ApiError(400, "page must be a positive number");
        }
        if (isNaN(limit) || limit <= 0) {
            throw new ApiError(400, "limit must be a positive number");
        }

        const filter = {};

        if (order_id) {
            filter.order_id = { $regex: order_id, $options: "i" };
        }

        const total = await ShopifyCancelledOrders.countDocuments(filter);

        const orders = await ShopifyCancelledOrders.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(200).json(
            new ApiResponse(200, {
                total,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                data: orders
            },
                "Cancelled orders fetched successfully",
            )

        );

    } catch (error) {
        next(error);
    }
};


// =====================================================
// 3️⃣ Update Cancelled Order by ID
// =====================================================
export const updateCancelledOrder = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new ApiError(400, "Order ID param is required");
        }

        const updatedOrder = await ShopifyCancelledOrders.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedOrder) {
            throw new ApiError(404, "Cancelled order not found");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Cancelled order updated successfully", updatedOrder));

    } catch (error) {
        next(error);
    }
};

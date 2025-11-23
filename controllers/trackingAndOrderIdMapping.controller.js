import { TrackingAndOrderIdMapping } from "../models/trackingIdAndOrderIdMapping.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


// =====================================================
// 1️⃣ Add Mapping
// =====================================================
export const addMapping = async (req, res, next) => {
    try {
        const { tracking_id, order_id } = req.body;

        // Validation
        if (!tracking_id) {
            throw new ApiError(400, "tracking_id is required");
        }
        if (!order_id || typeof order_id !== "number") {
            throw new ApiError(400, "order_id is required and must be a number");
        }

        // ❗ Check if tracking_id already exists
        const existingRecord = await TrackingAndOrderIdMapping.findOne({ tracking_id });

        if (existingRecord) {
            throw new ApiError(409, "tracking_id already exists");
        }

        const mapping = await TrackingAndOrderIdMapping.create({
            tracking_id,
            order_id
        });

        return res
            .status(201)
            .json(new ApiResponse(201, mapping, "Mapping added successfully"));

    } catch (error) {
        next(error);
    }
};



// =====================================================
// 2️⃣ Get Mapping (Filter: tracking_id OR order_id)
// =====================================================
export const getMapping = async (req, res, next) => {
    try {
        const { tracking_id, order_id } = req.query;

        if (!tracking_id && !order_id) {
            throw new ApiError(400, "tracking_id or order_id is required");
        }

        const filter = {};

        if (tracking_id) {
            filter.tracking_id = { $regex: tracking_id, $options: "i" };
        }

        if (order_id) {
            if (isNaN(order_id)) {
                throw new ApiError(400, "order_id must be a valid number");
            }
            filter.order_id = Number(order_id);
        }

        const records = await TrackingAndOrderIdMapping.find(filter).sort({ createdAt: -1 });

        return res
            .status(200)
            .json(new ApiResponse(200, records, "Mapping fetched successfully"

            ));

    } catch (error) {
        next(error);
    }
};



// =====================================================
// 3️⃣ Bulk Delete (Delete by multiple order_ids)
// =====================================================
export const bulkDeleteByOrderIds = async (req, res, next) => {
    try {
        const { order_ids } = req.body;

        // Validation
        if (!Array.isArray(order_ids) || order_ids.length === 0) {
            throw new ApiError(400, "order_ids must be a non-empty array");
        }

        const numericIds = order_ids.filter(id => typeof id === "number");

        if (numericIds.length !== order_ids.length) {
            throw new ApiError(400, "All order_ids must be numbers");
        }

        const result = await TrackingAndOrderIdMapping.deleteMany({
            order_id: { $in: numericIds }
        });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { deletedCount: result.deletedCount },
                    "Records deleted successfully",
                )
            );

    } catch (error) {
        next(error);
    }
};

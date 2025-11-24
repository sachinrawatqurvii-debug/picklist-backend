import { TrackingAndOrderIdMapping } from "../models/trackingIdAndOrderIdMapping.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


// =====================================================
// 1️⃣ Add Mapping
// =====================================================

export const addMapping = async (req, res, next) => {
    try {
        const { records } = req.body;

        // Validate: records must be an array
        if (!Array.isArray(records) || records.length === 0) {
            throw new ApiError(400, "records must be a non-empty array");
        }

        // Validate each record
        for (const r of records) {
            if (!r.tracking_id) {
                throw new ApiError(400, "tracking_id is required for all records");
            }
            if (!r.order_id || typeof r.order_id !== "number") {
                throw new ApiError(400, "order_id must be a number for all records");
            }
        }

        // Build bulk ops
        const bulkOps = records.map((r) => ({
            updateOne: {
                filter: { tracking_id: r.tracking_id },
                update: { $set: { order_id: r.order_id } },
                upsert: true
            }
        }));

        // Run bulk upsert
        const result = await TrackingAndOrderIdMapping.bulkWrite(bulkOps);

        return res.status(200).json(
            new ApiResponse(200, result, "Bulk upsert completed successfully")
        );

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


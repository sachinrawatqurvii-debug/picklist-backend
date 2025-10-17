import { PicklistResponse } from "../models/picklistResponse.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * @desc Create picklist responses in bulk
 * @route POST /api/picklist-responses/bulk-create
 */
export const createBulkPicklistResponse = async (req, res, next) => {
    try {
        const { responses } = req.body;

        if (!Array.isArray(responses) || responses.length === 0) {
            return next(new ApiError(400, "Responses data must be a non-empty array"));
        }

        // Insert multiple records at once
        const insertedResponses = await PicklistResponse.insertMany(responses, { ordered: false });

        return res
            .status(201)
            .json(new ApiResponse(201, insertedResponses, "Picklist responses added successfully"));
    } catch (error) {
        if (error.name === "ValidationError") {
            return next(new ApiError(400, "Invalid picklist response data", error.errors));
        }
        next(error);
    }
};

/**
 * @desc Get picklist responses by picklist_id
 * @route GET /api/picklist-responses?picklist_id=123
 */
export const getResponsesByPicklistId = async (req, res, next) => {
    try {
        const { picklist_id } = req.query;
        console.log(picklist_id)

        if (!picklist_id) {
            return next(new ApiError(400, "picklist_id is required"));
        }

        const numericId = Number(picklist_id);
        if (isNaN(numericId)) {
            return next(new ApiError(400, "picklist_id must be a valid number"));
        }

        // Find all PicklistResponses where picklist_id matches
        const responses = await PicklistResponse.find({ picklist_id: numericId });

        if (!responses || responses.length === 0) {
            return next(new ApiError(404, "No responses found for this picklist_id"));
        }

        res
            .status(200)
            .json(new ApiResponse(200, responses, "Picklist responses fetched successfully"));
    } catch (error) {
        next(error);
    }
};

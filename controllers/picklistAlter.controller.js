import { PicklistAlteration } from "../models/alterHistory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * @desc Get picklist history by picklist_id with pagination
 * @route GET /api/picklist-history?picklist_id=123&page=1&limit=100
 */
export const getPicklistAlterationHistoryByPicklistId = async (req, res, next) => {
    try {
        const { page = 1, limit = 100 } = req.query;



        const numericPage = Number(page);
        const numericLimit = Number(limit);

        if (isNaN(numericPage) || numericPage < 1) {
            return next(new ApiError(400, "page must be a valid number >= 1"));
        }
        if (isNaN(numericLimit) || numericLimit < 1) {
            return next(new ApiError(400, "limit must be a valid number >= 1"));
        }



        // Fetch paginated records
        const history = await PicklistAlteration.find()
            .sort({ createdAt: -1 }) // latest first
            .skip((numericPage - 1) * numericLimit)
            .limit(numericLimit);

        if (!history || history.length === 0) {
            return next(new ApiError(404, "No history found for this picklist"));
        }


        res.status(200).json(
            new ApiResponse(200, history, "Picklist history fetched successfully", {
                page: numericPage,
                limit: numericLimit,
            })
        );
    } catch (error) {
        next(error);
    }
};

export const getPicklistAlterationHistoryByPicklist = async (req, res, next) => {
    try {
        const { picklist_id } = req.query;
        // Fetch paginated records
        const history = await PicklistAlteration.findOne({ picklist_id })

        if (!history || history.length === 0) {
            return next(new ApiError(404, "No history found for this picklist_id"));
        }


        res.status(200).json(
            new ApiResponse(200, history, "Picklist alteration history fetched successfully", history));
    } catch (error) {
        next(error);
    }
};

export const createPicklistAlterationHistory = async (req, res, next) => {
    try {
        const { channel, picklist_id, sync_id } = req.body;
        if (!channel || !picklist_id || !sync_id) {
            return next(
                new ApiError(400, "channel, picklist_id, and sync_id are required")
            );
        }

        const numericPicklistId = Number(picklist_id);
        const numericSyncId = Number(sync_id)
        if (isNaN(numericPicklistId)) {
            return next(new ApiError(400, "picklist_id must be a valid number"));
        }


        const newHistory = await PicklistAlteration.create({
            channel,
            picklist_id: numericPicklistId,
            sync_id: numericSyncId,

        });

        return res
            .status(201)
            .json(new ApiResponse(201, newHistory, "Picklist alteration history created successfully"));
    } catch (error) {
        next(error);
    }
};

export const updatePicklistAlterationStatus = async (req, res, next) => {
    try {
        const { picklist_id } = req.body;
        if (!picklist_id) {
            return next(new ApiError(400, "Picklist id required"));
        }
        const picklist_history = await PicklistAlteration.findOneAndUpdate({ picklist_id }, { stock_updated: 1, status: "completed" }, { new: true });
        if (!picklist_history) {
            return next(new ApiError(404, "Picklist not found"));
        }
        return res.status(200).json(new ApiResponse(200, picklist_history, "Picklist history updated successfully."));
    } catch (error) {
        next(error);
    }
}

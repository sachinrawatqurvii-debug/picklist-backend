import { PicklistHistory } from "../models/picklistHistory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * @desc Get picklist history by picklist_id with pagination
 * @route GET /api/picklist-history?picklist_id=123&page=1&limit=100
 */
export const getPicklistHistoryByPicklistId = async (req, res, next) => {
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
        const history = await PicklistHistory.find()
            .sort({ createdAt: -1 }) // latest first
            .skip((numericPage - 1) * numericLimit)
            .limit(numericLimit);

        if (!history || history.length === 0) {
            return next(new ApiError(404, "No history found for this picklist_id"));
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

export const createPicklistHistory = async (req, res, next) => {
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


        const newHistory = await PicklistHistory.create({
            channel,
            picklist_id: numericPicklistId,
            sync_id: numericSyncId,

        });

        return res
            .status(201)
            .json(new ApiResponse(201, newHistory, "Picklist history created successfully"));
    } catch (error) {
        next(error);
    }
};


export const getPicklistHistoryByPicklist = async (req, res, next) => {
    try {
        const { picklist_id } = req.query;
        // Fetch paginated records
        const history = await PicklistHistory.findOne({ picklist_id })

        if (!history || history.length === 0) {
            return next(new ApiError(404, "No history found for this picklist_id"));
        }


        res.status(200).json(
            new ApiResponse(200, history, "Picklist history fetched successfully", history));
    } catch (error) {
        next(error);
    }
};



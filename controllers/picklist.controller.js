import { Picklist } from "../models/picklist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//  Create Picklist in Bulk
export const createBulkPicklist = async (req, res, next) => {
    try {
        const { picklists } = req.body; // expecting an array of picklist objects

        // Validate input
        if (!Array.isArray(picklists) || picklists.length === 0) {
            throw new ApiError(400, "Picklist data must be a non-empty array");
        }

        // Insert many records at once
        const createdPicklists = await Picklist.insertMany(picklists, { ordered: false });

        return res
            .status(201)
            .json(new ApiResponse(201, createdPicklists, "Picklists added successfully"));
    } catch (error) {
        // Handle duplicate key or validation errors
        if (error.name === "ValidationError") {
            return next(new ApiError(400, "Invalid picklist data", error.errors));
        }

        if (error.code === 11000) {
            return next(new ApiError(400, "Duplicate picklist detected", error.keyValue));
        }

        next(error); // Pass to global error handler
    }
};

// 📄 Get All Picklists
export const getAllPicklists = async (req, res, next) => {
    try {
        const picklists = await Picklist.find();
        res
            .status(200)
            .json(new ApiResponse(200, picklists, "Picklists fetched successfully"));
    } catch (error) {
        next(error);
    }
};


export const getPicklistByPicklistId = async (req, res, next) => {
    try {
        const { picklist_id } = req.query;

        // Validate input
        if (!picklist_id) {
            return next(new ApiError(400, "picklist_id is required"));
        }


        const numericId = Number(picklist_id);
        if (isNaN(numericId)) {
            return next(new ApiError(400, "picklist_id must be a valid number"));
        }

        // Find all records matching this picklist_id
        const picklists = await Picklist.find({ picklist_id: numericId });

        if (!picklists || picklists.length === 0) {
            return next(new ApiError(404, "No picklists found for this picklist_id"));
        }

        // Success response
        res
            .status(200)
            .json(new ApiResponse(200, picklists, "Picklists fetched successfully"));
    } catch (error) {
        next(error);
    }
};

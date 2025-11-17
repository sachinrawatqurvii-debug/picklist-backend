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

// ************************* update functionality added ***********************************

export const updatePicklistResponse = async (req, res, next) => {
    try {
        const { id, data } = req.body;

        if (!id) {
            return next(new ApiError(400, "id field is required"));
        }

        // Validate data field (optional, but safer)
        if (data === undefined || data === null) {
            return next(new ApiError(400, "data field is required"));
        }

        const updatedData = await PicklistResponse.findByIdAndUpdate(
            id,
            { $set: { status: data } },
            { new: true } // returns the updated document
        );

        if (!updatedData) {
            return next(new ApiError(404, "Record not found"));
        }

        return res
            .status(200)
            .json(new ApiResponse(200, updatedData, "Order updated successfully."));
    } catch (error) {
        next(error);
    }
};


// GET  picklist responses by picklist id array
export const getResponsesByPicklistArray = async (req, res, next) => {
    try {
        let { picklist_ids } = req.body;

        if (!Array.isArray(picklist_ids) || picklist_ids.length === 0) {
            return next(new ApiError(400, "picklist_ids must be a non-empty array"));
        }

        // Convert to numbers
        picklist_ids = picklist_ids.map(id => Number(id)).filter(id => !isNaN(id));

        // Fetch all matching records
        const records = await PicklistResponse.find({
            picklist_id: { $in: picklist_ids }
        });

        if (!records || records.length === 0) {
            return next(new ApiError(404, "No records found for given picklist_ids"));
        }

        // Grouping result
        const grouped = {};

        for (const rec of records) {
            const pid = rec.picklist_id;

            if (!grouped[pid]) {
                grouped[pid] = {
                    picklist_id: pid,
                    FirstAttemptFound: 0,
                    SecondAttemptFound: 0,
                    AlterFirstAttempt: 0,
                    AlterSecondAttempt: 0,
                    CuttingFirstAttempt: 0,
                    CuttingSecondAttempt: 0,
                    totalFound: 0,
                    totalAlter: 0,
                    totalCutting: 0,
                    records: []
                };
            }

            const isSameTime =
                new Date(rec.createdAt).getTime() === new Date(rec.updatedAt).getTime();

            // ---- STATUS CHECK ----
            const status = rec.status?.toLowerCase()?.trim(); // you used second_attemp_status earlier

            if (status === "found") {
                grouped[pid].totalFound++;

                if (isSameTime) grouped[pid].FirstAttemptFound++;
                else grouped[pid].SecondAttemptFound++;
            }

            if (status === "alter") {
                grouped[pid].totalAlter++;

                if (isSameTime) grouped[pid].AlterFirstAttempt++;
                else grouped[pid].AlterSecondAttempt++;
            }
            if (status === "cutting") {
                grouped[pid].totalCutting++;

                if (isSameTime) grouped[pid].CuttingFirstAttempt++;
                else grouped[pid].CuttingSecondAttempt++;
            }


            grouped[pid].records.push(rec);
        }

        const finalResponse = Object.values(grouped);

        res.status(200).json(
            new ApiResponse(
                200,
                finalResponse,
                "Unique picklist report generated successfully"
            )
        );
    } catch (error) {
        next(error);
    }
};





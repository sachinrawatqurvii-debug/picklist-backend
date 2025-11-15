import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SecondAttempt } from "../models/secondAttemp.model.js"

export const upsertSecondAttempt = async (req, res, next) => {
    try {
        const {
            picklist_id,
            employee_id,
            records,
            first_attempt_status,
            second_attemp_status,
            picklist_response_id,
            channel,
        } = req.body;

        if (!picklist_id || !employee_id || !picklist_response_id || !channel) {
            return next(new ApiError(400, "picklist_id, employee_id, channel and picklist_response_id are required"))
        }

        const updated = await SecondAttempt.findOneAndUpdate(
            { picklist_response_id }, // match condition
            {
                $set: {
                    records,
                    first_attempt_status,
                    second_attemp_status,
                    picklist_response_id,
                    channel,
                    picklist_id,
                    employee_id,
                }
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );
        return res.status(200).json(new ApiResponse(200, updated, "Second Attempt saved successfully!."))

    } catch (error) {
        next(error)
    }
};


// GET — fetch all second attempts by picklist_id
export const getSecondAttemptByPicklist = async (req, res, next) => {
    try {
        const { picklist_id } = req.params;

        if (!picklist_id) {
            return next(new ApiError(400, "picklist_id is required"));
        }

        const data = await SecondAttempt.find({ picklist_id });

        if (data.length === 0) {
            return res.status(200).json(new ApiResponse(200, data, `No second attempt found for ${picklist_id} picklist id.`))
        }
        return res.status(200).json(new ApiResponse(200, data, "Second Attempt records fetched successfully!."))

    } catch (error) {
        next(error)
    }
};

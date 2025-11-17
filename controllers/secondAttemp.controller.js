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

// GET all second records by date range

export const filterSecondAttemptByDate = async (req, res, next) => {
    try {
        const { date, start, end } = req.query;
        console.log('Query parameters:', { date, start, end });

        let query = {};

        // SINGLE DATE
        if (date) {
            console.log('Processing single date:', date);

            // Method 1: Using string concatenation (more reliable)
            const startOfDay = new Date(date + 'T00:00:00.000Z');
            const endOfDay = new Date(date + 'T23:59:59.999Z');


            console.log('Start of day:', startOfDay);
            console.log('End of day:', endOfDay);

            if (isNaN(startOfDay.getTime()) || isNaN(endOfDay.getTime())) {
                console.log('Invalid date format');
                return next(new ApiError(400, "Invalid date format"));
            }

            query.createdAt = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        // DATE RANGE
        if (start && end) {
            console.log('Processing date range:', { start, end });

            const startDate = new Date(start + 'T00:00:00.000Z');
            const endDate = new Date(end + 'T23:59:59.999Z');

            console.log('Parsed start date:', startDate);
            console.log('Parsed end date:', endDate);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.log('Invalid date format for range');
                return next(new ApiError(400, "Invalid date format for start or end date"));
            }

            if (startDate > endDate) {
                return next(new ApiError(400, "Start date must be before end date"));
            }

            query.createdAt = {
                $gte: startDate,
                $lte: endDate
            };
        }

        // Validation - check if any date parameter was provided
        if (!date && (!start || !end)) {
            return next(new ApiError(400, "Please provide date or start & end dates"));
        }

        console.log('Final query:', JSON.stringify(query));

        const data = await SecondAttempt.find(query).sort({ createdAt: -1 });
        console.log('Found records:', data.length);

        return res.status(200).json(
            new ApiResponse(200, data, "Filtered records fetched successfully")
        );

    } catch (err) {
        console.error('Error in filterSecondAttemptByDate:', err);
        next(err);
    }
};


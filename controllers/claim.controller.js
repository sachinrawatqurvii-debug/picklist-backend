import { Claim } from "../models/claim.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const addClaim = async (req, res, next) => {
    try {
        const { channel, tracking_id, category, employee_id } = req.body;

        if (!channel || !tracking_id || !category || !employee_id) {
            return next(new ApiError(400, "All fields are required."));
        }

        const exists = await Claim.findOne({ tracking_id });
        if (exists) {
            return next(new ApiError(400, `${tracking_id} already exists.`));
        }

        const claim = await Claim.create({
            channel,
            tracking_id,
            category,
            employee_id,
            statusHistory: [{ status: "new", processBy: employee_id }]
        });

        return res
            .status(201)
            .json(new ApiResponse(201, claim, "Claim added successfully"));
    } catch (error) {
        next(error);
    }
};

export const getClaims = async (req, res, next) => {
    try {
        let {
            tracking_id,
            employee_id,
            category,
            channel,
            start_date,
            end_date,
            page = 1,
            limit = 25,
            sort = "-createdAt"
        } = req.query;

        const query = {};

        if (tracking_id) query.tracking_id = tracking_id;
        if (employee_id) query.employee_id = employee_id;
        if (category) query.category = category;
        if (channel) query.channel = channel;

        if (start_date || end_date) {
            query.createdAt = {};
            if (start_date) query.createdAt.$gte = new Date(start_date);
            if (end_date) query.createdAt.$lte = new Date(end_date);
        }

        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit;

        const claims = await Claim.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await Claim.countDocuments(query);

        return res.json(
            new ApiResponse(200, {
                claims,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
                filters_used: query
            }, "Claims fetched successfully")
        );
    } catch (error) {
        next(error);
    }
};

export const updateClaimStatus = async (req, res, next) => {
    try {
        const { tracking_id, status, processBy } = req.body;

        if (!tracking_id || !status) {
            return next(new ApiError(400, "tracking_id and status are required."));
        }

        if (!["new", "processed", "completed", "rejected"].includes(status)) {
            return next(new ApiError(400, "Invalid status value"));
        }

        const claim = await Claim.findOne({ tracking_id });

        if (!claim) {
            return next(new ApiError(404, "Claim not found"));
        }

        const statuses = claim.statusHistory.map((s) => s.status);

        if (statuses.includes(status)) {
            return next(new ApiError(400, `Status "${status}" already processed.`));
        }

        // ✅ Update current status
        claim.status = status;

        // ✅ Add history record
        claim.statusHistory.push({
            status,
            updatedAt: new Date(),
            processBy
        });

        await claim.save();

        return res.json(
            new ApiResponse(200, claim, "Status updated successfully")
        );

    } catch (error) {
        next(error);
    }
};

export const getClaimReport = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;

        const match = {};

        // Date filter
        if (start_date || end_date) {
            match.createdAt = {};
            if (start_date) match.createdAt.$gte = new Date(start_date);
            if (end_date) match.createdAt.$lte = new Date(end_date);
        }

        const report = await Claim.aggregate([

            // 1) Match filters
            { $match: match },

            // 2) Facet gives multiple reports in ONE query
            {
                $facet: {
                    // ---------------------------------------
                    // A) STATUS COUNTS
                    // ---------------------------------------
                    statusCounts: [
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $project: {
                                status: "$_id",
                                count: 1,
                                _id: 0
                            }
                        }
                    ],

                    // ---------------------------------------
                    // B) DATE-WISE ANALYTICS (Daily Trend)
                    // ---------------------------------------
                    dailyTrends: [
                        {
                            $group: {
                                _id: {
                                    year: { $year: "$createdAt" },
                                    month: { $month: "$createdAt" },
                                    day: { $dayOfMonth: "$createdAt" }
                                },
                                total: { $sum: 1 },
                                new: {
                                    $sum: {
                                        $cond: [{ $eq: ["$status", "new"] }, 1, 0]
                                    }
                                },
                                processed: {
                                    $sum: {
                                        $cond: [{ $eq: ["$status", "processed"] }, 1, 0]
                                    }
                                },
                                completed: {
                                    $sum: {
                                        $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
                                    }
                                },
                                rejected: {
                                    $sum: {
                                        $cond: [{ $eq: ["$status", "rejected"] }, 1, 0]
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                date: {
                                    $dateFromParts: {
                                        year: "$_id.year",
                                        month: "$_id.month",
                                        day: "$_id.day"
                                    }
                                },
                                total: 1,
                                new: 1,
                                processed: 1,
                                completed: 1,
                                rejected: 1,
                                _id: 0
                            }
                        },
                        { $sort: { date: 1 } }
                    ]
                }
            }
        ]);

        // -------------------------------
        // Format status counts properly
        // -------------------------------
        const statusResult = {
            new: 0,
            processed: 0,
            completed: 0,
            rejected: 0,
            total: 0
        };

        report[0].statusCounts.forEach(item => {
            statusResult[item.status] = item.count;
            statusResult.total += item.count;
        });

        return res.json(
            new ApiResponse(
                200,
                {
                    summary: statusResult,
                    dailyAnalytics: report[0].dailyTrends,
                    filters: match
                },
                "Claim report generated successfully"
            )
        );

    } catch (error) {
        next(error);
    }
};

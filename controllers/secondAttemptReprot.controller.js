import { PicklistResponse } from "../models/picklistResponse.model.js";
import { SecondAttempt } from "../models/secondAttemp.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendPicklistReportEmail } from "../utils/sendPicklistReport.js";

const secondAttempReport = async (req, res, next) => {
    try {
        // Daily date filter
        const today = new Date();
        const start = new Date(today.setHours(0, 0, 0, 0));
        const end = new Date(today.setHours(23, 59, 59, 999));

        const report = await PicklistResponse.aggregate([
            // 1️⃣ Filter today's first attempt
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },

            // 2️⃣ Project required fields
            {
                $project: {
                    picklist_id: 1,
                    channel: 1,
                    employee_id: 1,
                    status: 1,
                    rackSpace: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            },

            // 3️⃣ Group by picklist_id
            {
                $group: {
                    _id: "$picklist_id",
                    channel: { $first: "$channel" },
                    firstAttemptEmployeeId: { $first: "$employee_id" },
                    totalRecords: { $sum: 1 },
                    records: { $push: "$$ROOT" }
                }
            },

            // 4️⃣ Calculate expectedToFound and other metrics
            {
                $addFields: {
                    expectedToFound: {
                        $size: {
                            $filter: {
                                input: "$records",
                                as: "r",
                                cond: {
                                    $and: [
                                        { $ne: ["$$r.rackSpace", null] },
                                        { $ne: ["$$r.rackSpace", ""] },
                                        {
                                            $not: {
                                                $regexMatch: {
                                                    input: {
                                                        $toLower: {
                                                            $ifNull: ["$$r.rackSpace", ""]
                                                        }
                                                    },
                                                    regex: "virtual"
                                                }
                                            }
                                        },
                                        {
                                            $not: {
                                                $regexMatch: {
                                                    input: {
                                                        $toLower: {
                                                            $ifNull: ["$$r.rackSpace", ""]
                                                        }
                                                    },
                                                    regex: "default"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    actualFoundFirstAttempt: {
                        $size: {
                            $filter: {
                                input: "$records",
                                as: "r",
                                cond: {
                                    $and: [
                                        { $eq: ["$$r.status", "Found"] },
                                        { $ne: ["$$r.rackSpace", null] },
                                        { $ne: ["$$r.rackSpace", ""] },
                                        {
                                            $not: {
                                                $regexMatch: {
                                                    input: {
                                                        $toLower: {
                                                            $ifNull: ["$$r.rackSpace", ""]
                                                        }
                                                    },
                                                    regex: "virtual"
                                                }
                                            }
                                        },
                                        {
                                            $not: {
                                                $regexMatch: {
                                                    input: {
                                                        $toLower: {
                                                            $ifNull: ["$$r.rackSpace", ""]
                                                        }
                                                    },
                                                    regex: "default"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    firstAttemptAlterFound: {
                        $size: {
                            $filter: {
                                input: "$records",
                                as: "r",
                                cond: {
                                    $and: [
                                        { $eq: ["$$r.status", "Alter"] },
                                        {
                                            $or: [
                                                { $eq: ["$$r.createdAt", "$$r.updatedAt"] },
                                                {
                                                    $lte: [
                                                        { $abs: { $subtract: ["$$r.updatedAt", "$$r.createdAt"] } },
                                                        1000
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },

            // 5️⃣ Lookup second attempt
            {
                $lookup: {
                    from: "secondattemps",
                    let: { picklist_id: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$picklist_id", "$$picklist_id"] },
                                createdAt: { $gte: start, $lte: end }
                            }
                        },
                        {
                            $project: {
                                employee_id: 1,
                                second_attemp_status: 1,
                                createdAt: 1,
                                updatedAt: 1
                            }
                        }
                    ],
                    as: "secondAttempt"
                }
            },

            // 6️⃣ Calculate second attempt metrics
            {
                $addFields: {
                    secondAttemptEmployeeId: {
                        $cond: [
                            { $gt: [{ $size: "$secondAttempt" }, 0] },
                            { $arrayElemAt: ["$secondAttempt.employee_id", 0] },
                            null
                        ]
                    },
                    actualFoundSecondAttempt: {
                        $size: {
                            $filter: {
                                input: "$secondAttempt",
                                as: "r",
                                cond: {
                                    $eq: ["$$r.second_attemp_status", "Found"]
                                }
                            }
                        }
                    },
                    secondAttemptAlterFound: {
                        $size: {
                            $filter: {
                                input: "$secondAttempt",
                                as: "r",
                                cond: {
                                    $and: [
                                        { $eq: ["$$r.second_attemp_status", "Alter"] },
                                        {
                                            $gt: [
                                                { $abs: { $subtract: ["$$r.updatedAt", "$$r.createdAt"] } },
                                                1000
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },

            // 7️⃣ Calculate efficiencies
            {
                $addFields: {
                    efficiencyFirstAttempt: {
                        $cond: [
                            { $eq: ["$expectedToFound", 0] },
                            0,
                            {
                                $round: [
                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    "$actualFoundFirstAttempt",
                                                    "$expectedToFound"
                                                ]
                                            },
                                            100
                                        ]
                                    },
                                    2
                                ]
                            }
                        ]
                    },
                    efficiencySecondAttempt: {
                        $cond: [
                            {
                                $lte: [
                                    { $subtract: ["$expectedToFound", "$actualFoundFirstAttempt"] },
                                    0
                                ]
                            },
                            0,
                            {
                                $round: [
                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    "$actualFoundSecondAttempt",
                                                    { $subtract: ["$expectedToFound", "$actualFoundFirstAttempt"] }
                                                ]
                                            },
                                            100
                                        ]
                                    },
                                    2
                                ]
                            }
                        ]
                    }
                }
            },

            // 8️⃣ Final picklist-wise single record
            {
                $project: {
                    _id: 0,
                    picklist_id: "$_id",
                    channel: 1,
                    firstAttemptEmployeeId: 1,
                    secondAttemptEmployeeId: 1,
                    totalRecords: 1,
                    expectedToFound: 1,
                    actualFoundFirstAttempt: 1,
                    actualFoundSecondAttempt: 1,
                    firstAttemptAlterFound: 1,
                    secondAttemptAlterFound: 1,
                    efficiencyFirstAttempt: 1,
                    efficiencySecondAttempt: 1
                }
            },

            { $sort: { picklist_id: 1 } }
        ]);

        // 9️⃣ First Attempt Employee-wise Summary
        const firstAttemptEmployeeSummary = await PicklistResponse.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: "$employee_id",
                    totalPicklists: { $addToSet: "$picklist_id" },
                    totalRecords: { $sum: 1 },
                    totalExpectedToFound: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ["$rackSpace", null] },
                                        { $ne: ["$rackSpace", ""] },
                                        { $not: { $regexMatch: { input: { $toLower: { $ifNull: ["$rackSpace", ""] } }, regex: "virtual" } } },
                                        { $not: { $regexMatch: { input: { $toLower: { $ifNull: ["$rackSpace", ""] } }, regex: "default" } } }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    totalFound: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$status", "Found"] },
                                        { $ne: ["$rackSpace", null] },
                                        { $ne: ["$rackSpace", ""] },
                                        { $not: { $regexMatch: { input: { $toLower: { $ifNull: ["$rackSpace", ""] } }, regex: "virtual" } } },
                                        { $not: { $regexMatch: { input: { $toLower: { $ifNull: ["$rackSpace", ""] } }, regex: "default" } } }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    totalAlter: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$status", "Alter"] },
                                        {
                                            $or: [
                                                { $eq: ["$createdAt", "$updatedAt"] },
                                                { $lte: [{ $abs: { $subtract: ["$updatedAt", "$createdAt"] } }, 1000] }
                                            ]
                                        }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    channels: { $addToSet: "$channel" }
                }
            },
            {
                $addFields: {
                    efficiency: {
                        $cond: [
                            { $eq: ["$totalExpectedToFound", 0] },
                            0,
                            {
                                $round: [
                                    {
                                        $multiply: [
                                            { $divide: ["$totalFound", "$totalExpectedToFound"] },
                                            100
                                        ]
                                    },
                                    2
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    employee_id: "$_id",
                    totalPicklists: { $size: "$totalPicklists" },
                    totalRecords: 1,
                    totalExpectedToFound: 1,
                    totalFound: 1,
                    totalAlter: 1,
                    efficiency: 1,
                    channels: 1
                }
            },
            { $sort: { employee_id: 1 } }
        ]);

        // 🔟 Second Attempt Employee-wise Summary
        const secondAttemptEmployeeSummary = await SecondAttempt.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: "$employee_id",
                    totalPicklists: { $addToSet: "$picklist_id" },
                    totalRecords: { $sum: 1 },
                    totalFound: {
                        $sum: {
                            $cond: [
                                { $eq: ["$second_attemp_status", "Found"] },
                                1,
                                0
                            ]
                        }
                    },
                    totalAlter: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$second_attemp_status", "Alter"] },
                                        { $gt: [{ $abs: { $subtract: ["$updatedAt", "$createdAt"] } }, 1000] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    channels: { $addToSet: "$channel" }
                }
            },
            {
                $project: {
                    _id: 0,
                    employee_id: "$_id",
                    totalPicklists: { $size: "$totalPicklists" },
                    totalRecords: 1,
                    totalFound: 1,
                    totalAlter: 1,
                    channels: 1
                }
            },
            { $sort: { employee_id: 1 } }
        ]);

        console.log(`Total picklists processed: ${report.length}`);
        console.log(`First attempt employees: ${firstAttemptEmployeeSummary.length}`);
        console.log(`Second attempt employees: ${secondAttemptEmployeeSummary.length}`);

        const response = {
            picklistReport: report,
            firstAttemptEmployeeSummary: firstAttemptEmployeeSummary,
            secondAttemptEmployeeSummary: secondAttemptEmployeeSummary
        };

        // ✅ Email send karo automatically
        try {
            const emailResult = await sendPicklistReportEmail(response);
            console.log("Email sent:", emailResult);
        } catch (emailError) {
            console.error("Email sending failed:", emailError);
            // Email failure par bhi response send karo, error throw mat karo
        }



        res.status(200).json(new ApiResponse(200, response, "Daily merged attempt summary with employee-wise breakdown"));
    } catch (error) {
        console.error('Error in secondAttempReport:', error);
        next(error);
    }
};

const report = async (req, res, next) => {
    try {
        // Daily date filter
        const today = new Date();
        const start = new Date(today.setHours(0, 0, 0, 0));
        const end = new Date(today.setHours(23, 59, 59, 999));

        const report = await PicklistResponse.aggregate([
            // 1️⃣ Filter today's first attempt
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },

            // 2️⃣ Project required fields
            {
                $project: {
                    picklist_id: 1,
                    channel: 1,
                    employee_id: 1,
                    status: 1,
                    rackSpace: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            },

            // 3️⃣ Group by picklist_id
            {
                $group: {
                    _id: "$picklist_id",
                    channel: { $first: "$channel" },
                    firstAttemptEmployeeId: { $first: "$employee_id" },
                    totalRecords: { $sum: 1 },
                    records: { $push: "$$ROOT" }
                }
            },

            // 4️⃣ Calculate expectedToFound and other metrics
            {
                $addFields: {
                    expectedToFound: {
                        $size: {
                            $filter: {
                                input: "$records",
                                as: "r",
                                cond: {
                                    $and: [
                                        { $ne: ["$$r.rackSpace", null] },
                                        { $ne: ["$$r.rackSpace", ""] },
                                        {
                                            $not: {
                                                $regexMatch: {
                                                    input: {
                                                        $toLower: {
                                                            $ifNull: ["$$r.rackSpace", ""]
                                                        }
                                                    },
                                                    regex: "virtual"
                                                }
                                            }
                                        },
                                        {
                                            $not: {
                                                $regexMatch: {
                                                    input: {
                                                        $toLower: {
                                                            $ifNull: ["$$r.rackSpace", ""]
                                                        }
                                                    },
                                                    regex: "default"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    actualFoundFirstAttempt: {
                        $size: {
                            $filter: {
                                input: "$records",
                                as: "r",
                                cond: {
                                    $and: [
                                        { $eq: ["$$r.status", "Found"] },
                                        { $ne: ["$$r.rackSpace", null] },
                                        { $ne: ["$$r.rackSpace", ""] },
                                        {
                                            $not: {
                                                $regexMatch: {
                                                    input: {
                                                        $toLower: {
                                                            $ifNull: ["$$r.rackSpace", ""]
                                                        }
                                                    },
                                                    regex: "virtual"
                                                }
                                            }
                                        },
                                        {
                                            $not: {
                                                $regexMatch: {
                                                    input: {
                                                        $toLower: {
                                                            $ifNull: ["$$r.rackSpace", ""]
                                                        }
                                                    },
                                                    regex: "default"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    firstAttemptAlterFound: {
                        $size: {
                            $filter: {
                                input: "$records",
                                as: "r",
                                cond: {
                                    $and: [
                                        { $eq: ["$$r.status", "Alter"] },
                                        {
                                            $or: [
                                                { $eq: ["$$r.createdAt", "$$r.updatedAt"] },
                                                {
                                                    $lte: [
                                                        { $abs: { $subtract: ["$$r.updatedAt", "$$r.createdAt"] } },
                                                        1000
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },

            // 5️⃣ Lookup second attempt
            {
                $lookup: {
                    from: "secondattemps",
                    let: { picklist_id: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$picklist_id", "$$picklist_id"] },
                                createdAt: { $gte: start, $lte: end }
                            }
                        },
                        {
                            $project: {
                                employee_id: 1,
                                second_attemp_status: 1,
                                createdAt: 1,
                                updatedAt: 1
                            }
                        }
                    ],
                    as: "secondAttempt"
                }
            },

            // 6️⃣ Calculate second attempt metrics
            {
                $addFields: {
                    secondAttemptEmployeeId: {
                        $cond: [
                            { $gt: [{ $size: "$secondAttempt" }, 0] },
                            { $arrayElemAt: ["$secondAttempt.employee_id", 0] },
                            null
                        ]
                    },
                    actualFoundSecondAttempt: {
                        $size: {
                            $filter: {
                                input: "$secondAttempt",
                                as: "r",
                                cond: {
                                    $eq: ["$$r.second_attemp_status", "Found"]
                                }
                            }
                        }
                    },
                    secondAttemptAlterFound: {
                        $size: {
                            $filter: {
                                input: "$secondAttempt",
                                as: "r",
                                cond: {
                                    $and: [
                                        { $eq: ["$$r.second_attemp_status", "Alter"] },
                                        {
                                            $gt: [
                                                { $abs: { $subtract: ["$$r.updatedAt", "$$r.createdAt"] } },
                                                1000
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },

            // 7️⃣ Calculate efficiencies
            {
                $addFields: {
                    efficiencyFirstAttempt: {
                        $cond: [
                            { $eq: ["$expectedToFound", 0] },
                            0,
                            {
                                $round: [
                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    "$actualFoundFirstAttempt",
                                                    "$expectedToFound"
                                                ]
                                            },
                                            100
                                        ]
                                    },
                                    2
                                ]
                            }
                        ]
                    },
                    efficiencySecondAttempt: {
                        $cond: [
                            {
                                $lte: [
                                    { $subtract: ["$expectedToFound", "$actualFoundFirstAttempt"] },
                                    0
                                ]
                            },
                            0,
                            {
                                $round: [
                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    "$actualFoundSecondAttempt",
                                                    { $subtract: ["$expectedToFound", "$actualFoundFirstAttempt"] }
                                                ]
                                            },
                                            100
                                        ]
                                    },
                                    2
                                ]
                            }
                        ]
                    }
                }
            },

            // 8️⃣ Final picklist-wise single record
            {
                $project: {
                    _id: 0,
                    picklist_id: "$_id",
                    channel: 1,
                    firstAttemptEmployeeId: 1,
                    secondAttemptEmployeeId: 1,
                    totalRecords: 1,
                    expectedToFound: 1,
                    actualFoundFirstAttempt: 1,
                    actualFoundSecondAttempt: 1,
                    firstAttemptAlterFound: 1,
                    secondAttemptAlterFound: 1,
                    efficiencyFirstAttempt: 1,
                    efficiencySecondAttempt: 1
                }
            },

            { $sort: { picklist_id: 1 } }
        ]);

        // 9️⃣ First Attempt Employee-wise Summary
        const firstAttemptEmployeeSummary = await PicklistResponse.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: "$employee_id",
                    totalPicklists: { $addToSet: "$picklist_id" },
                    totalRecords: { $sum: 1 },
                    totalExpectedToFound: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ["$rackSpace", null] },
                                        { $ne: ["$rackSpace", ""] },
                                        { $not: { $regexMatch: { input: { $toLower: { $ifNull: ["$rackSpace", ""] } }, regex: "virtual" } } },
                                        { $not: { $regexMatch: { input: { $toLower: { $ifNull: ["$rackSpace", ""] } }, regex: "default" } } }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    totalFound: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$status", "Found"] },
                                        { $ne: ["$rackSpace", null] },
                                        { $ne: ["$rackSpace", ""] },
                                        { $not: { $regexMatch: { input: { $toLower: { $ifNull: ["$rackSpace", ""] } }, regex: "virtual" } } },
                                        { $not: { $regexMatch: { input: { $toLower: { $ifNull: ["$rackSpace", ""] } }, regex: "default" } } }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    totalAlter: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$status", "Alter"] },
                                        {
                                            $or: [
                                                { $eq: ["$createdAt", "$updatedAt"] },
                                                { $lte: [{ $abs: { $subtract: ["$updatedAt", "$createdAt"] } }, 1000] }
                                            ]
                                        }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    channels: { $addToSet: "$channel" }
                }
            },
            {
                $addFields: {
                    efficiency: {
                        $cond: [
                            { $eq: ["$totalExpectedToFound", 0] },
                            0,
                            {
                                $round: [
                                    {
                                        $multiply: [
                                            { $divide: ["$totalFound", "$totalExpectedToFound"] },
                                            100
                                        ]
                                    },
                                    2
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    employee_id: "$_id",
                    totalPicklists: { $size: "$totalPicklists" },
                    totalRecords: 1,
                    totalExpectedToFound: 1,
                    totalFound: 1,
                    totalAlter: 1,
                    efficiency: 1,
                    channels: 1
                }
            },
            { $sort: { employee_id: 1 } }
        ]);

        // 🔟 Second Attempt Employee-wise Summary
        const secondAttemptEmployeeSummary = await SecondAttempt.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: "$employee_id",
                    totalPicklists: { $addToSet: "$picklist_id" },
                    totalRecords: { $sum: 1 },
                    totalFound: {
                        $sum: {
                            $cond: [
                                { $eq: ["$second_attemp_status", "Found"] },
                                1,
                                0
                            ]
                        }
                    },
                    totalAlter: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$second_attemp_status", "Alter"] },
                                        { $gt: [{ $abs: { $subtract: ["$updatedAt", "$createdAt"] } }, 1000] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    channels: { $addToSet: "$channel" }
                }
            },
            {
                $project: {
                    _id: 0,
                    employee_id: "$_id",
                    totalPicklists: { $size: "$totalPicklists" },
                    totalRecords: 1,
                    totalFound: 1,
                    totalAlter: 1,
                    channels: 1
                }
            },
            { $sort: { employee_id: 1 } }
        ]);

        console.log(`Total picklists processed: ${report.length}`);
        console.log(`First attempt employees: ${firstAttemptEmployeeSummary.length}`);
        console.log(`Second attempt employees: ${secondAttemptEmployeeSummary.length}`);

        const response = {
            picklistReport: report,
            firstAttemptEmployeeSummary: firstAttemptEmployeeSummary,
            secondAttemptEmployeeSummary: secondAttemptEmployeeSummary
        };

        res.status(200).json(new ApiResponse(200, response, "Daily merged attempt summary with employee-wise breakdown"));
    } catch (error) {
        console.error('Error in secondAttempReport:', error);
        next(error);
    }
};


export { secondAttempReport, report };
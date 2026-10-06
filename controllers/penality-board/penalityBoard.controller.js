import PenalityBoard from '../../models/penality-board/penalityBoard.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

const addMistake = async (req, res, next) => {
  try {
    const { name, mistake, mistake_image } = req.body;

    if (!name || !mistake) {
      throw new ApiError(400, 'name and mistake are required');
    }

    const createdMistake = await PenalityBoard.create({
      name: name.trim(),
      mistake: mistake.trim(),
      mistake_image: mistake_image || null,
    });

    return res.status(201).json(new ApiResponse(201, createdMistake, `Mistake added for ${name}`));
  } catch (error) {
    next(error);
  }
};

const getMistakeReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};

    // Date range provided
    if (startDate || endDate) {
      const dateFilter = {};

      if (startDate) {
        const start = new Date(startDate);

        if (Number.isNaN(start.getTime())) {
          throw new ApiError(400, 'Invalid startDate');
        }

        start.setHours(0, 0, 0, 0);
        dateFilter.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        if (Number.isNaN(end.getTime())) {
          throw new ApiError(400, 'Invalid endDate');
        }

        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }

      matchStage.createdAt = dateFilter;
    } else {
      // Default: today's data
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      matchStage.createdAt = {
        $gte: todayStart,
        $lte: todayEnd,
      };
    }

    const report = await PenalityBoard.aggregate([
      // 1. Filter by date
      {
        $match: matchStage,
      },

      // 2. Group by employee + mistake
      {
        $group: {
          _id: {
            name: '$name',
            mistake: '$mistake',
          },
          count: {
            $sum: 1,
          },
          mistake_image: {
            $first: '$mistake_image',
          },
        },
      },

      // 3. Group mistakes by employee
      {
        $group: {
          _id: '$_id.name',

          totalMistakes: {
            $sum: '$count',
          },

          mistakes: {
            $push: {
              mistake: '$_id.mistake',
              count: '$count',
              mistake_image: '$mistake_image',
            },
          },
        },
      },

      // 4. Sort employees by total mistakes
      {
        $sort: {
          totalMistakes: -1,
        },
      },

      // 5. Create complete report + all mistakes count
      {
        $group: {
          _id: null,

          allMistakes: {
            $sum: '$totalMistakes',
          },

          employees: {
            $push: {
              name: '$_id',
              totalMistakes: '$totalMistakes',
              mistakes: '$mistakes',
            },
          },
        },
      },

      // 6. Final response structure
      {
        $project: {
          _id: 0,
          allMistakes: 1,
          employees: 1,
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, report, 'Mistake report fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export { addMistake, getMistakeReport };

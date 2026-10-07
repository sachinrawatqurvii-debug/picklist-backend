import PenalityBoard from '../../models/penality-board/penalityBoard.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

/**
 * Add a new mistake record
 */
const addMistake = async (req, res, next) => {
  try {
    const { name, mistake, mistake_image, mistake_date } = req.body;

    // Validate required fields
    if (!name?.trim()) {
      throw new ApiError(400, 'Name is required');
    }

    if (!mistake?.trim()) {
      throw new ApiError(400, 'Mistake is required');
    }

    if (!mistake_date) {
      throw new ApiError(400, 'Mistake date is required');
    }

    // Validate mistake date
    const parsedMistakeDate = new Date(mistake_date);

    if (Number.isNaN(parsedMistakeDate.getTime())) {
      throw new ApiError(400, 'Invalid mistake_date');
    }

    const createdMistake = await PenalityBoard.create({
      name: name.trim(),
      mistake: mistake.trim(),
      mistake_date: parsedMistakeDate,
      mistake_image: mistake_image?.trim() || null,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, createdMistake, `Mistake added for ${name.trim()}`));
  } catch (error) {
    next(error);
  }
};

/**
 * Get mistake report
 *
 * Supported query params:
 * ?startDate=2026-10-01
 * ?endDate=2026-10-07
 *
 * If no date is provided:
 * Returns today's mistake report.
 */
const getMistakeReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};

    /**
     * ---------------------------------------------------------
     * DATE FILTER
     * ---------------------------------------------------------
     */

    if (startDate || endDate) {
      const dateFilter = {};

      let start;
      let end;

      /**
       * Start date
       */
      if (startDate) {
        start = new Date(startDate);

        if (Number.isNaN(start.getTime())) {
          throw new ApiError(400, 'Invalid startDate');
        }

        start.setHours(0, 0, 0, 0);

        dateFilter.$gte = start;
      }

      /**
       * End date
       */
      if (endDate) {
        end = new Date(endDate);

        if (Number.isNaN(end.getTime())) {
          throw new ApiError(400, 'Invalid endDate');
        }

        end.setHours(23, 59, 59, 999);

        dateFilter.$lte = end;
      }

      /**
       * Validate date range
       */
      if (start && end && start > end) {
        throw new ApiError(400, 'startDate cannot be greater than endDate');
      }

      matchStage.mistake_date = dateFilter;
    } else {
      /**
       * -------------------------------------------------------
       * DEFAULT: TODAY
       * -------------------------------------------------------
       */

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      matchStage.mistake_date = {
        $gte: todayStart,
        $lte: todayEnd,
      };
    }

    /**
     * ---------------------------------------------------------
     * AGGREGATION
     * ---------------------------------------------------------
     */

    const report = await PenalityBoard.aggregate([
      /**
       * 1. Filter records by date
       */
      {
        $match: matchStage,
      },

      /**
       * 2. Sort latest records first
       *
       * This makes $first deterministic when selecting
       * mistake_image.
       */
      {
        $sort: {
          mistake_date: -1,
          createdAt: -1,
        },
      },

      /**
       * 3. Group by employee + mistake
       */
      {
        $group: {
          _id: {
            name: '$name',
            mistake: '$mistake',
          },

          count: {
            $sum: 1,
          },

          /**
           * Get the latest available image
           */
          mistake_image: {
            $first: '$mistake_image',
          },

          latestMistakeDate: {
            $first: '$mistake_date',
          },
        },
      },

      /**
       * 4. Group all mistakes by employee
       */
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
              latestMistakeDate: '$latestMistakeDate',
            },
          },
        },
      },

      /**
       * 5. Sort employees by total mistakes
       */
      {
        $sort: {
          totalMistakes: -1,
          _id: 1,
        },
      },

      /**
       * 6. Create final report
       */
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

      /**
       * 7. Remove MongoDB internal _id
       */
      {
        $project: {
          _id: 0,
          allMistakes: 1,
          employees: 1,
        },
      },
    ]);

    /**
     * ---------------------------------------------------------
     * EMPTY RESULT HANDLING
     * ---------------------------------------------------------
     *
     * aggregate() returns [] when no records are found.
     */
    const result = report[0] || {
      allMistakes: 0,
      employees: [],
    };

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Mistake report fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export { addMistake, getMistakeReport };

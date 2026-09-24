import { PicklistHistory } from '../models/picklistHistory.model.js';
import { PicklistResponse } from '../models/picklistResponse.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
const getPicklistResponses = async (req, res, next) => {
  const { date, startDate, endDate } = req.body || {};

  try {
    let startOfDay, endOfDay, rangeLabel;

    if (startDate || endDate) {
      // ---- Date range case ----
      if (!startDate || !endDate) {
        throw new ApiError(400, 'Both startDate and endDate are required for a range');
      }

      const startIstStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
      }).format(new Date(startDate));

      const endIstStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
      }).format(new Date(endDate));

      startOfDay = new Date(`${startIstStr}T00:00:00+05:30`);
      endOfDay = new Date(`${endIstStr}T00:00:00+05:30`);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1); // include full end date

      rangeLabel = `${startIstStr} to ${endIstStr}`;
    } else {
      // ---- Single date / default today case ----
      const targetDate = date ? new Date(date) : new Date();

      const istDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
      }).format(targetDate);

      startOfDay = new Date(`${istDateStr}T00:00:00+05:30`);
      endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      rangeLabel = istDateStr;
    }

    const [result] = await PicklistHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lt: endOfDay },
        },
      },
      {
        $project: { picklist_id: 1, _id: 0 },
      },
      {
        $lookup: {
          from: PicklistResponse.collection.name,
          localField: 'picklist_id',
          foreignField: 'picklist_id',
          as: 'picklistResponses',
        },
      },
      {
        $group: {
          _id: null,
          picklistIds: { $push: '$picklist_id' },
          picklistResponses: {
            $push: '$picklistResponses',
          },
        },
      },
      {
        $project: {
          _id: 0,
          picklistIds: 1,
          picklistResponses: {
            $reduce: {
              input: '$picklistResponses',
              initialValue: [],
              in: { $concatArrays: ['$$value', '$$this'] },
            },
          },
        },
      },
    ]);

    if (!result || result.picklistIds.length === 0) {
      throw new ApiError(404, `No Picklist ids found for ${rangeLabel}`);
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          total: result.picklistIds.length,
          picklistIds: result.picklistIds,
          totalPicklistResponse: result.picklistResponses.length,
          picklistResponses: result.picklistResponses,
        },
        'Picklist response fetched successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};


export { getPicklistResponses };

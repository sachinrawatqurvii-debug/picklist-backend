import { QrWithUrl } from '../../models/QrWithUrl/qrWithUrl.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

// Bulk create QR records
const createQrWithUrl = async (req, res, next) => {
  try {
    const payload = req.body;

    if (!Array.isArray(payload) || payload.length === 0) {
      throw new ApiError(400, 'Payload must be a non-empty array');
    }

    const validEntries = payload.map((item) => ({
      channel: item.channel,
      sessionId: Number(item.sessionId),
      qrId: Number(item.qrId),
    }));

    // Validate required fields
    const invalidEntry = validEntries.some(
      (item) => !item.channel || !Number.isFinite(item.sessionId) || !Number.isFinite(item.qrId)
    );

    if (invalidEntry) {
      throw new ApiError(400, 'Invalid QR data provided');
    }

    const result = await QrWithUrl.insertMany(validEntries);

    return res.status(201).json(new ApiResponse(201, result, 'QrWithUrl created successfully'));
  } catch (error) {
    next(error);
  }
};

// Get QR records by sessionId and date filters
const getQrWithUrl = async (req, res, next) => {
  try {
    const { sessionId, date, startDate, endDate } = req.query;

    const filter = {};

    // Optional sessionId filter
    if (sessionId !== undefined) {
      const parsedSessionId = Number(sessionId);

      if (!Number.isFinite(parsedSessionId)) {
        throw new ApiError(400, 'Invalid sessionId');
      }

      filter.sessionId = parsedSessionId;
    }

    // Specific date filter
    if (date) {
      const selectedDate = new Date(date);

      if (Number.isNaN(selectedDate.getTime())) {
        throw new ApiError(400, 'Invalid date format');
      }

      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      filter.createdAt = {
        $gte: dayStart,
        $lt: dayEnd,
      };
    }
    // Date range filter
    else if (startDate || endDate) {
      if (!startDate || !endDate) {
        throw new ApiError(400, 'Both startDate and endDate are required');
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
        throw new ApiError(400, 'Invalid date range');
      }

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 1);

      filter.createdAt = {
        $gte: start,
        $lt: end,
      };
    }
    // Default: Today's records
    else {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);

      filter.createdAt = {
        $gte: todayStart,
        $lt: tomorrowStart,
      };
    }

    const result = await QrWithUrl.find(filter).sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, result, 'QrWithUrl fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export { createQrWithUrl, getQrWithUrl };

const mongoose = require('mongoose');
const ApiResponse = require('../../../common/utils/apiResponse');

// Minimal Attendance Model for aggregation
const Attendance = mongoose.model('Attendance', new mongoose.Schema({}, { strict: false }), 'attendances');

/**
 * Generate sequential attendance report for a site
 */
exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { siteId, startDate, endDate } = req.query;

    if (!siteId) {
      return ApiResponse.error(res, 'Site ID is required', 400);
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const report = await Attendance.aggregate([
      {
        $match: {
          siteId: new mongoose.Types.ObjectId(siteId),
          date: { $gte: start, $lte: end },
        },
      },
      {
        $sort: { date: 1 },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          records: {
            $push: {
              labourId: '$labourId',
              status: '$status',
              checkIn: '$checkInTime',
              checkOut: '$checkOutTime',
              totalHours: '$totalHours',
            },
          },
          totalPresent: {
            $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return ApiResponse.success(res, 'Attendance report generated', report);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate summary payroll report (total hours per labourer)
 */
exports.getPayrollSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const summary = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$labourId',
          totalWorkedHours: { $sum: '$totalHours' },
          daysPresent: { $sum: 1 },
        },
      },
    ]);

    return ApiResponse.success(res, 'Payroll summary generated', summary);
  } catch (error) {
    next(error);
  }
};

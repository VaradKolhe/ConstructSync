const Attendance = require('../models/Attendance');
const ApiResponse = require('../../../common/utils/apiResponse');

/**
 * Mark Attendance (Check-in)
 * @route POST /api/attendances/check-in
 */
exports.checkIn = async (req, res, next) => {
  try {
    const { labourId, siteId, date } = req.body;
    const supervisorId = req.user.id;

    // Use current date if not provided (Format: YYYY-MM-DD for consistency)
    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Check if attendance already exists
    const exists = await Attendance.findOne({ labourId, date: attendanceDate });
    if (exists) {
      return ApiResponse.error(res, 'Attendance already marked for this labourer today', 400);
    }

    const attendance = await Attendance.create({
      labourId,
      siteId,
      supervisorId,
      date: attendanceDate,
      checkInTime: new Date(),
    });

    return ApiResponse.success(res, 'Check-in successful', attendance, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark Check-out
 * @route PUT /api/attendances/check-out/:id
 */
exports.checkOut = async (req, res, next) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return ApiResponse.error(res, 'Attendance record not found', 404);

    if (attendance.checkOutTime) {
      return ApiResponse.error(res, 'Already checked out', 400);
    }

    const checkOutTime = new Date();
    const diffMs = checkOutTime - attendance.checkInTime;
    const totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

    attendance.checkOutTime = checkOutTime;
    attendance.totalHours = parseFloat(totalHours);
    await attendance.save();

    return ApiResponse.success(res, 'Check-out successful', attendance);
  } catch (error) {
    next(error);
  }
};

/**
 * Get daily attendance for a site
 * @route GET /api/attendances/site/:siteId
 */
exports.getSiteAttendance = async (req, res, next) => {
  try {
    const { date } = req.query;
    const { siteId } = req.params;

    const queryDate = date ? new Date(date) : new Date();
    queryDate.setUTCHours(0, 0, 0, 0);

    const attendances = await Attendance.find({ siteId, date: queryDate });
    return ApiResponse.success(res, 'Attendance data fetched', attendances);
  } catch (error) {
    next(error);
  }
};

/**
 * Get attendance history for a labourer
 * @route GET /api/attendances/labour/:labourId
 */
exports.getLabourHistory = async (req, res, next) => {
  try {
    const { labourId } = req.params;
    const history = await Attendance.find({ labourId }).sort({ date: -1 });
    return ApiResponse.success(res, 'Labour attendance history fetched', history);
  } catch (error) {
    next(error);
  }
};

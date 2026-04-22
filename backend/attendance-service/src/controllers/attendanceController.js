const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const AttendanceAudit = require('../models/AttendanceAudit');
const ApiResponse = require('../../../common/utils/apiResponse');
const { logAudit } = require('../../../common/utils/auditLogger');

/**
 * Mark Attendance (Check-in)
 * @route POST /api/attendances/check-in
 */
exports.checkIn = async (req, res, next) => {
  try {
    const { labourId, siteId, date, status } = req.body;
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
      status: status || 'PRESENT',
    });

    await logAudit(mongoose, {
      userId: req.user.id,
      action: 'ATTENDANCE_CHECK_IN',
      module: 'ATTENDANCE',
      details: { labourId, siteId, date: attendanceDate },
      ipAddress: req.ip
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
    const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    attendance.checkOutTime = checkOutTime;
    attendance.totalHours = totalHours;

    // FR-3.7 Anomaly Flagging
    if (totalHours > 12 || totalHours < 0) {
      attendance.isAnomaly = true;
      attendance.anomalyReason = 'System flagged: Hours out of standard range (0-12 hours)';
    }

    await attendance.save();

    await logAudit(mongoose, {
      userId: req.user.id,
      action: 'ATTENDANCE_CHECK_OUT',
      module: 'ATTENDANCE',
      details: { attendanceId: attendance._id, totalHours },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, 'Check-out successful', attendance);
  } catch (error) {
    next(error);
  }
};

/**
 * Edit Attendance (Manual override)
 * @route PUT /api/attendances/:id
 */
exports.editAttendance = async (req, res, next) => {
  try {
    const { status, checkInTime, checkOutTime, date } = req.body;
    const attendanceId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) return ApiResponse.error(res, 'Attendance record not found', 404);

    // FR-3.5 Permissions: Supervisor same-day only, Admin anytime
    if (userRole === 'SUPERVISOR') {
      const recordDate = new Date(attendance.date);
      const today = new Date();
      recordDate.setUTCHours(0, 0, 0, 0);
      today.setUTCHours(0, 0, 0, 0);

      if (recordDate.getTime() !== today.getTime()) {
        return ApiResponse.error(res, 'Supervisors can only edit attendance for the current day. Cross-day edits require Admin approval.', 403);
      }
    }

    const previousData = attendance.toObject();
    const updates = {};

    if (status) attendance.status = status;
    if (checkInTime) attendance.checkInTime = new Date(checkInTime);
    if (checkOutTime) attendance.checkOutTime = new Date(checkOutTime);
    if (date) {
      const newDate = new Date(date);
      newDate.setUTCHours(0, 0, 0, 0);
      attendance.date = newDate;
    }

    // Recalculate hours if times changed
    if (checkInTime || checkOutTime) {
      if (attendance.checkInTime && attendance.checkOutTime) {
        const diffMs = attendance.checkOutTime - attendance.checkInTime;
        const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        attendance.totalHours = totalHours;

        if (totalHours > 12 || totalHours < 0) {
          attendance.isAnomaly = true;
          attendance.anomalyReason = 'System flagged: Manual edit resulted in hours out of standard range';
        } else {
          attendance.isAnomaly = false;
          attendance.anomalyReason = '';
        }
      }
    }

    await attendance.save();

    // Log the audit record (FR-3.8)
    await AttendanceAudit.create({
      attendanceId,
      modifiedBy: userId,
      action: 'EDIT',
      changes: {
        previous: previousData,
        updated: attendance.toObject(),
      },
    });

    await logAudit(mongoose, {
      userId: req.user.id,
      action: 'ATTENDANCE_EDITED',
      module: 'ATTENDANCE',
      details: { attendanceId: attendance._id, changes: req.body },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, 'Attendance updated successfully', attendance);
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

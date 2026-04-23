const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const AttendanceAudit = require('../models/AttendanceAudit');
const ApiResponse = require('../../../common/utils/apiResponse');
const { logAudit } = require('../../../common/utils/auditLogger');

/**
 * Helper to check if a site is locked
 */
const checkSiteLock = async (siteId) => {
  const site = await mongoose.connection.db.collection('sites').findOne({ 
    _id: new mongoose.Types.ObjectId(siteId) 
  });
  return site && site.isLocked;
};

/**
 * Mark Attendance (Check-in)
 */
exports.checkIn = async (req, res, next) => {
  try {
    const { labourId, siteId, date, status } = req.body;

    if (await checkSiteLock(siteId)) {
      return ApiResponse.error(res, 'SECURITY PROTOCOL: Site access locked by Admin.', 403);
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const activeSession = await Attendance.findOne({ 
      'metadata.labourId': labourId, 
      checkOutTime: null 
    });
    if (activeSession) {
      return ApiResponse.error(res, 'Personnel already clocked in elsewhere.', 400);
    }

    const exists = await Attendance.findOne({ 
      'metadata.labourId': labourId, 
      date: attendanceDate 
    });
    if (exists) {
      return ApiResponse.error(res, 'Attendance already marked for today', 400);
    }

    const attendance = await Attendance.create({
      metadata: { labourId, siteId },
      supervisorId: req.user.id,
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
 * Bulk Check-in
 */
exports.bulkCheckIn = async (req, res, next) => {
  try {
    const { labourIds, siteId, date, status } = req.body;

    if (await checkSiteLock(siteId)) {
      return ApiResponse.error(res, 'SECURITY PROTOCOL: Site access locked.', 403);
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const existing = await Attendance.find({
      'metadata.labourId': { $in: labourIds },
      date: attendanceDate
    });
    
    const existingIds = existing.map(e => e.metadata.labourId.toString());
    const newLabourIds = labourIds.filter(id => !existingIds.includes(id));

    if (newLabourIds.length === 0) {
      return ApiResponse.error(res, 'All personnel already clocked in', 400);
    }

    const checkInTime = new Date();
    const records = newLabourIds.map(id => ({
      metadata: { labourId: id, siteId },
      supervisorId: req.user.id,
      date: attendanceDate,
      checkInTime,
      status: status || 'PRESENT'
    }));

    const result = await Attendance.insertMany(records);

    await logAudit(mongoose, {
      userId: req.user.id,
      action: 'ATTENDANCE_BULK_CHECK_IN',
      module: 'ATTENDANCE',
      details: { count: result.length, siteId },
      ipAddress: req.ip
    });

    return ApiResponse.success(res, `Bulk check-in successful for ${result.length} personnel`, result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk Check-out
 */
exports.bulkCheckOut = async (req, res, next) => {
  try {
    const { attendanceIds } = req.body;
    const records = await Attendance.find({ _id: { $in: attendanceIds }, checkOutTime: null });
    
    if (records.length === 0) return ApiResponse.error(res, 'No active records found', 404);

    const checkOutTime = new Date();
    const bulkOps = records.map(record => {
      const diffMs = checkOutTime - record.checkInTime;
      const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      
      const update = { checkOutTime, totalHours };
      return {
        updateMany: {
          filter: { metadata: record.metadata, date: record.date },
          update: { $set: update }
        }
      };
    });

    await Attendance.bulkWrite(bulkOps);

    return ApiResponse.success(res, `Bulk check-out successful`);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark Check-out
 */
exports.checkOut = async (req, res, next) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance || attendance.checkOutTime) return ApiResponse.error(res, 'Invalid record', 400);

    const checkOutTime = new Date();
    const diffMs = checkOutTime - attendance.checkInTime;
    const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    const updateData = { checkOutTime, totalHours };

    await Attendance.updateMany(
      { metadata: attendance.metadata, date: attendance.date },
      { $set: updateData }
    );

    return ApiResponse.success(res, 'Check-out successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Edit Attendance
 */
exports.editAttendance = async (req, res, next) => {
  try {
    const { status, checkInTime, checkOutTime, date } = req.body;
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return ApiResponse.error(res, 'Record not found', 404);

    const previousData = attendance.toObject();
    
    if (status) attendance.status = status;
    if (checkInTime) attendance.checkInTime = new Date(checkInTime);
    if (checkOutTime) attendance.checkOutTime = new Date(checkOutTime);
    
    if (attendance.checkInTime && attendance.checkOutTime) {
      const diffMs = attendance.checkOutTime - attendance.checkInTime;
      attendance.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    const updatedData = attendance.toObject();
    delete updatedData._id;

    await Attendance.updateMany(
      { metadata: attendance.metadata, date: attendance.date },
      { $set: updatedData }
    );

    await AttendanceAudit.create({
      attendanceId: attendance._id,
      modifiedBy: req.user.id,
      action: 'EDIT',
      changes: { previous: previousData, updated: updatedData },
    });

    return ApiResponse.success(res, 'Attendance updated', attendance);
  } catch (error) {
    next(error);
  }
};

/**
 * Get daily site attendance
 */
exports.getSiteAttendance = async (req, res, next) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setUTCHours(0, 0, 0, 0);

    const attendances = await Attendance.find({ 
      'metadata.siteId': new mongoose.Types.ObjectId(req.params.siteId), 
      date: queryDate 
    });
    return ApiResponse.success(res, 'Attendance data fetched', attendances);
  } catch (error) {
    next(error);
  }
};

/**
 * Get labour history
 */
exports.getLabourHistory = async (req, res, next) => {
  try {
    const history = await Attendance.find({ 
      'metadata.labourId': new mongoose.Types.ObjectId(req.params.labourId) 
    }).sort({ date: -1 });
    return ApiResponse.success(res, 'History fetched', history);
  } catch (error) {
    next(error);
  }
};

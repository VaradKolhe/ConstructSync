const mongoose = require('mongoose');
const crypto = require('crypto');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const ApiResponse = require('../../../common/utils/apiResponse');
const { Attendance, Labour, Site, LabourGroup } = require('../models/MinimalModels');
const ReportCache = require('../models/ReportCache');
const ReportLog = require('../models/ReportLog');

/**
 * Helper to generate cache key from parameters
 */
const generateCacheKey = (params, format) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => ({ ...acc, [key]: params[key] }), {});
  return crypto.createHash('md5').update(JSON.stringify({ ...sortedParams, format })).digest('hex');
};

/**
 * Helper to log report generation
 */
const logReport = async (userId, type, params) => {
  await ReportLog.create({
    generatedBy: userId,
    reportType: type,
    parameters: params,
  });
};

/**
 * Get aggregated data based on filters
 */
const getAggregatedData = async (filters) => {
  const { siteId, labourId, groupId, startDate, endDate, skillType } = filters;

  const match = {};
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }
  if (siteId) match.siteId = new mongoose.Types.ObjectId(siteId);
  if (labourId) match.labourId = new mongoose.Types.ObjectId(labourId);

  // If group filtering is requested
  if (groupId) {
    const group = await LabourGroup.findById(groupId);
    if (group) {
      match.labourId = { $in: group.members };
    }
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'labours',
        localField: 'labourId',
        foreignField: '_id',
        as: 'labourDetails',
      },
    },
    { $unwind: '$labourDetails' },
  ];

  // Skill Type filter
  if (skillType) {
    pipeline.push({ $match: { 'labourDetails.skills': skillType } });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'sites',
        localField: 'siteId',
        foreignField: '_id',
        as: 'siteDetails',
      },
    },
    { $unwind: '$siteDetails' },
    {
      $group: {
        _id: '$labourId',
        labourIdStr: { $first: '$labourDetails.labourId' },
        name: { $first: '$labourDetails.name' },
        skills: { $first: '$labourDetails.skills' },
        siteName: { $first: '$siteDetails.name' },
        totalPresent: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
        totalHalfDay: { $sum: { $cond: [{ $eq: ['$status', 'HALF-DAY'] }, 1, 0] } },
        totalLeave: { $sum: { $cond: [{ $eq: ['$status', 'LEAVE'] }, 1, 0] } },
        totalAbsent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
        totalHours: { $sum: '$totalHours' },
      },
    },
    {
      $project: {
        labourId: '$labourIdStr',
        name: 1,
        skills: 1,
        siteName: 1,
        totalPresent: 1,
        totalHalfDay: 1,
        totalLeave: 1,
        totalAbsent: 1,
        totalWorkingHours: '$totalHours',
        averageDailyHours: {
          $cond: [
            { $gt: [{ $add: ['$totalPresent', '$totalHalfDay'] }, 0] },
            { $divide: ['$totalHours', { $add: ['$totalPresent', '$totalHalfDay'] }] },
            0,
          ],
        },
      },
    }
  );

  return await Attendance.aggregate(pipeline);
};

/**
 * Export Payroll Report to Excel (FR-5.3)
 */
exports.exportPayrollExcel = async (req, res, next) => {
  try {
    const cacheKey = generateCacheKey(req.query, 'EXCEL');
    const cached = await ReportCache.findOne({ cacheKey });
    if (cached) {
      await logReport(req.user.id, 'PAYROLL_EXCEL_CACHE', req.query);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=payroll_report.xlsx');
      return res.send(cached.fileBuffer);
    }

    const data = await getAggregatedData(req.query);
    if (!data || data.length === 0) {
      return ApiResponse.error(res, 'No data detected for the requested boundary. Export aborted.', 404);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payroll');

    worksheet.columns = [
      { header: 'Labour ID', key: 'labourId', width: 20 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Skills', key: 'skills', width: 20 },
      { header: 'Site', key: 'siteName', width: 20 },
      { header: 'Present Days', key: 'totalPresent', width: 15 },
      { header: 'Half Days', key: 'totalHalfDay', width: 15 },
      { header: 'Leave Days', key: 'totalLeave', width: 15 },
      { header: 'Absent Days', key: 'totalAbsent', width: 15 },
      { header: 'Total Hours', key: 'totalWorkingHours', width: 15 },
      { header: 'Avg Hours', key: 'averageDailyHours', width: 15 },
    ];

    data.forEach(item => {
      worksheet.addRow({
        ...item,
        skills: Array.isArray(item.skills) ? item.skills.join(', ') : item.skills
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    await ReportCache.create({
      cacheKey,
      reportType: 'PAYROLL',
      format: 'EXCEL',
      fileBuffer: buffer,
      generatedBy: req.user.id,
    });

    await logReport(req.user.id, 'PAYROLL_EXCEL', req.query);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=payroll_report.xlsx');
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Export PDF Report (FR-5.4)
 */
exports.exportPdfReport = async (req, res, next) => {
  try {
    const cacheKey = generateCacheKey(req.query, 'PDF');
    const cached = await ReportCache.findOne({ cacheKey });
    if (cached) {
      await logReport(req.user.id, 'REPORT_PDF_CACHE', req.query);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
      return res.send(cached.fileBuffer);
    }

    const data = await getAggregatedData(req.query);
    if (!data || data.length === 0) {
      return ApiResponse.error(res, 'No data detected for the requested boundary. Export aborted.', 404);
    }

    const doc = new PDFDocument({ margin: 30 });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);

      await ReportCache.create({
        cacheKey,
        reportType: 'GENERAL',
        format: 'PDF',
        fileBuffer: pdfBuffer,
        generatedBy: req.user.id,
      });

      await logReport(req.user.id, 'REPORT_PDF', req.query);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
      res.send(pdfBuffer);
    });

    // Letterhead (FR-5.4)
    doc.fontSize(20).text('CONSTRUCTSYNC MANAGEMENT SYSTEM', { align: 'center' });
    doc.fontSize(10).text('Enterprise Labour & Attendance Solutions', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated Date: ${new Date().toLocaleString()}`);
    doc.text(`Report Type: Attendance Summary`);
    doc.moveDown();

    // Table Header
    doc.fontSize(10).text('Labour ID', 30, 150);
    doc.text('Name', 120, 150);
    doc.text('Site', 250, 150);
    doc.text('Hours', 350, 150);
    doc.text('Status (P/H/L/A)', 420, 150);
    doc.moveTo(30, 165).lineTo(570, 165).stroke();

    let y = 175;
    data.forEach((item) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(item.labourId, 30, y);
      doc.text(item.name.substring(0, 20), 120, y);
      doc.text(item.siteName.substring(0, 15), 250, y);
      doc.text(item.totalWorkingHours.toFixed(1), 350, y);
      doc.text(`${item.totalPresent}/${item.totalHalfDay}/${item.totalLeave}/${item.totalAbsent}`, 420, y);
      y += 20;
    });

    // Page Numbers (FR-5.4)
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.text(`Page ${i + 1} of ${range.count}`, 500, 750);
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};

/**
 * Get Report Generation Logs (FR-5.7)
 */
exports.getReportLogs = async (req, res, next) => {
  try {
    const logs = await ReportLog.find().sort({ createdAt: -1 }).limit(100);
    return ApiResponse.success(res, 'Report generation logs fetched', logs);
  } catch (error) {
    next(error);
  }
};

/**
 * Keep original functions for backward compatibility/quick JSON views
 */
exports.getAttendanceReport = async (req, res, next) => {
  try {
    const data = await getAggregatedData(req.query);
    return ApiResponse.success(res, 'Attendance report generated', data);
  } catch (error) {
    next(error);
  }
};

exports.getPayrollSummary = async (req, res, next) => {
  try {
    const data = await getAggregatedData(req.query);
    return ApiResponse.success(res, 'Payroll summary generated', data);
  } catch (error) {
    next(error);
  }
};

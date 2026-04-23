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
  if (siteId) match['metadata.siteId'] = new mongoose.Types.ObjectId(siteId);
  if (labourId) match['metadata.labourId'] = new mongoose.Types.ObjectId(labourId);

  // If group filtering is requested
  if (groupId) {
    const group = await LabourGroup.findById(groupId);
    if (group) {
      match['metadata.labourId'] = { $in: group.members };
    }
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'labours',
        localField: 'metadata.labourId',
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
        localField: 'metadata.siteId',
        foreignField: '_id',
        as: 'siteDetails',
      },
    },
    { $unwind: '$siteDetails' },
    {
      $group: {
        _id: '$metadata.labourId',
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
        monthlySalary: { $ifNull: ['$labourDetails.monthlySalary', 0] },
        totalEarnings: {
          $multiply: [
            { $divide: [{ $ifNull: ['$labourDetails.monthlySalary', 0] }, 30] },
            { $add: ['$totalPresent', { $multiply: ['$totalHalfDay', 0.5] }] }
          ]
        },
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
 * Export PDF Report (FR-5.4) - INDUSTRIAL REDESIGN
 */
exports.exportPdfReport = async (req, res, next) => {
  try {
    const { type = 'attendance' } = req.query;
    const cacheKey = generateCacheKey(req.query, `PDF_${type.toUpperCase()}`);
    
    const cached = await ReportCache.findOne({ cacheKey });
    if (cached) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=CONSTRUCTSYNC_${type.toUpperCase()}_REPORT.pdf`);
      return res.send(cached.fileBuffer);
    }

    const data = await getAggregatedData(req.query);
    if (!data || data.length === 0) {
      return ApiResponse.error(res, 'No data detected for the requested boundary.', 404);
    }

    const doc = new PDFDocument({ 
      margin: 40,
      size: 'A4',
      layout: 'landscape'
    });
    
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      await ReportCache.create({
        cacheKey,
        reportType: type.toUpperCase(),
        format: 'PDF',
        fileBuffer: pdfBuffer,
        generatedBy: req.user.id,
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=CONSTRUCTSYNC_${type.toUpperCase()}_REPORT.pdf`);
      res.send(pdfBuffer);
    });

    // --- INDUSTRIAL HEADER DESIGN ---
    doc.rect(0, 0, doc.page.width, 100).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(28).font('Helvetica-Bold').text('CONSTRUCT', 40, 35, { continued: true }).fillColor('#ea580c').text('SYNC');
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Bold').text('ENTERPRISE LOGISTICS & MANPOWER SURVEILLANCE', 40, 70);
    
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text(type.toUpperCase() + ' DISPATCH SUMMARY', 0, 45, { align: 'right', indent: 40 });
    doc.fontSize(8).font('Helvetica').text(`GENERATED: ${new Date().toLocaleString().toUpperCase()}`, 0, 60, { align: 'right', indent: 40 });

    // --- METADATA BOX ---
    doc.rect(40, 120, 760, 40).fill('#f8fafc').stroke('#0f172a');
    doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text('PERIOD BOUNDARY:', 55, 135);
    doc.font('Helvetica').text(`${req.query.startDate || 'START'} TO ${req.query.endDate || 'END'}`, 150, 135);
    doc.font('Helvetica-Bold').text('PROJECT SECTOR:', 350, 135);
    doc.font('Helvetica').text(data[0]?.siteName || 'ALL SECTORS', 440, 135);
    doc.font('Helvetica-Bold').text('UNIT COUNT:', 600, 135);
    doc.font('Helvetica').text(`${data.length} PERSONNEL`, 670, 135);

    // --- TABLE HEADERS ---
    const tableTop = 180;
    doc.rect(40, tableTop, 760, 25).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    
    doc.text('PERSONNEL ID', 50, tableTop + 8);
    doc.text('FULL NAME & SPECIALIZATION', 150, tableTop + 8);
    
    if (type === 'payroll') {
      doc.text('MONTHLY SALARY', 400, tableTop + 8, { width: 100, align: 'right' });
      doc.text('TOTAL HOURS', 510, tableTop + 8, { width: 80, align: 'right' });
      doc.text('NET EARNINGS (INR)', 640, tableTop + 8, { width: 150, align: 'right' });
    } else {
      doc.text('ATTENDANCE (P/H/L/A)', 400, tableTop + 8, { width: 150, align: 'center' });
      doc.text('TOTAL HOURS', 560, tableTop + 8, { width: 100, align: 'right' });
      doc.text('AVG DAILY', 680, tableTop + 8, { width: 100, align: 'right' });
    }

    // --- TABLE ROWS ---
    let y = tableTop + 25;
    data.forEach((item, index) => {
      // Alternating row background
      if (index % 2 === 0) {
        doc.rect(40, y, 760, 30).fill('#f1f5f9');
      }
      
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(item.labourId, 50, y + 10);
      doc.font('Helvetica').text(item.name.toUpperCase(), 150, y + 6);
      doc.fillColor('#64748b').fontSize(7).text(item.skills.join(', ').toUpperCase(), 150, y + 18);
      
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica');
      if (type === 'payroll') {
        doc.text(`₹ ${item.monthlySalary.toLocaleString()}`, 400, y + 10, { width: 100, align: 'right' });
        doc.text(`${item.totalWorkingHours.toFixed(1)} HRS`, 510, y + 10, { width: 80, align: 'right' });
        doc.fillColor('#15803d').font('Helvetica-Bold').text(`₹ ${Math.round(item.totalEarnings).toLocaleString()}`, 640, y + 10, { width: 150, align: 'right' });
      } else {
        const stats = `${item.totalPresent} / ${item.totalHalfDay} / ${item.totalLeave} / ${item.totalAbsent}`;
        doc.text(stats, 400, y + 10, { width: 150, align: 'center' });
        doc.font('Helvetica-Bold').text(`${item.totalWorkingHours.toFixed(1)}`, 560, y + 10, { width: 100, align: 'right' });
        doc.font('Helvetica').text(`${(item.averageDailyHours || 0).toFixed(1)}`, 680, y + 10, { width: 100, align: 'right' });
      }
      
      y += 30;

      // Page break check
      if (y > 500) {
        doc.addPage();
        y = 50;
        // Re-draw headers for new page if needed or just continue
      }
    });

    // --- FOOTER ---
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica');
      doc.text(`CONSTRUCTSYNC INTERNAL DOCUMENT • CLASSIFICATION: CONFIDENTIAL • PAGE ${i + 1} OF ${pageCount}`, 40, doc.page.height - 30, { align: 'center' });
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

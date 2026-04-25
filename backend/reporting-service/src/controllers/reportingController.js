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
  return crypto.createHash('md5').update(JSON.stringify({ ...sortedParams, format, version: 'v4' })).digest('hex');
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
  const { siteId, labourId, groupId, startDate, endDate, skillType, search } = filters;

  const pipeline = [];

  // Stage 0: Initial Match for Date (highly indexed)
  const dateMatch = {};
  if (startDate || endDate) {
    dateMatch.date = {};
    if (startDate) dateMatch.date.$gte = new Date(startDate);
    if (endDate) dateMatch.date.$lte = new Date(endDate);
  }
  pipeline.push({ $match: dateMatch });

  // Stage 1: Normalize IDs to strings for robust comparison
  pipeline.push({
    $addFields: {
      siteIdStr: { $toString: '$metadata.siteId' },
      labourIdStr: { $toString: '$metadata.labourId' }
    }
  });

  // Stage 2: Apply Filters
  const filterMatch = {};
  if (siteId && siteId !== 'undefined' && siteId !== '') {
    filterMatch.siteIdStr = siteId.toString();
  }
  if (labourId && labourId !== 'undefined' && labourId !== '') {
    filterMatch.labourIdStr = labourId.toString();
  }

  // If group filtering is requested
  if (groupId && groupId !== 'undefined' && groupId !== '') {
    const group = await LabourGroup.findById(groupId);
    if (group) {
      const memberIdStrings = group.members.map(m => m.toString());
      filterMatch.labourIdStr = { $in: memberIdStrings };
    }
  }

  if (Object.keys(filterMatch).length > 0) {
    pipeline.push({ $match: filterMatch });
  }

  // Stage 3: Lookup Labour Details
  pipeline.push(
    {
      $lookup: {
        from: 'labours',
        localField: 'metadata.labourId',
        foreignField: '_id',
        as: 'labourDetails',
      },
    },
    { $unwind: '$labourDetails' }
  );

  // Search filter
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { 'labourDetails.name': { $regex: search, $options: 'i' } },
          { 'labourDetails.labourId': { $regex: search, $options: 'i' } }
        ]
      }
    });
  }

  // Skill Type filter
  if (skillType) {
    pipeline.push({ $match: { 'labourDetails.skills': skillType } });
  }

  // Stage 4: Lookup Site Details and Group
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
        _id: {
          labourId: '$metadata.labourId',
          siteId: '$metadata.siteId'
        },
        labourIdStr: { $first: '$labourDetails.labourId' },
        name: { $first: '$labourDetails.name' },
        skills: { $first: '$labourDetails.skills' },
        siteName: { $first: '$siteDetails.name' },
        totalPresent: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
        totalHalfDay: { $sum: { $cond: [{ $eq: ['$status', 'HALF-DAY'] }, 1, 0] } },
        totalLeave: { $sum: { $cond: [{ $eq: ['$status', 'LEAVE'] }, 1, 0] } },
        totalAbsent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
        totalHours: { $sum: '$totalHours' },
        monthlySalary: { $first: '$labourDetails.monthlySalary' },
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
        monthlySalary: { $ifNull: ['$monthlySalary', 0] },
        totalEarnings: {
          $multiply: [
            { $divide: [{ $ifNull: ['$monthlySalary', 25000] }, 30] }, // Default 25k if missing for demo
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
    const { type = 'payroll' } = req.query;
    const cacheKey = generateCacheKey(req.query, `EXCEL_${type.toUpperCase()}`);
    
    const cached = await ReportCache.findOne({ cacheKey });
    if (cached) {
      await logReport(req.user.id, `${type.toUpperCase()}_EXCEL_CACHE`, req.query);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_report.xlsx`);
      return res.send(cached.fileBuffer);
    }

    const data = await getAggregatedData(req.query);
    if (!data || data.length === 0) {
      return ApiResponse.error(res, 'No data detected for the requested boundary. Export aborted.', 404);
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(type.toUpperCase());

    const baseColumns = [
      { header: 'Labour ID', key: 'labourId', width: 20 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Skills', key: 'skills', width: 20 },
      { header: 'Site', key: 'siteName', width: 20 },
    ];

    if (type === 'payroll') {
      worksheet.columns = [
        ...baseColumns,
        { header: 'Monthly Salary', key: 'monthlySalary', width: 15 },
        { header: 'Total Days', key: 'totalDays', width: 12 },
        { header: 'Total Hours', key: 'totalWorkingHours', width: 15 },
        { header: 'Avg Hours', key: 'averageDailyHours', width: 15 },
        { header: 'Net Earnings', key: 'totalEarnings', width: 15 },
      ];
    } else {
      worksheet.columns = [
        ...baseColumns,
        { header: 'Present', key: 'totalPresent', width: 10 },
        { header: 'Half Day', key: 'totalHalfDay', width: 10 },
        { header: 'Leave', key: 'totalLeave', width: 10 },
        { header: 'Absent', key: 'totalAbsent', width: 10 },
        { header: 'Total Hours', key: 'totalWorkingHours', width: 15 },
        { header: 'Avg Hours', key: 'averageDailyHours', width: 15 },
      ];
    }

    data.forEach(item => {
      const rowData = {
        labourId: item.labourId || 'N/A',
        name: item.name || 'UNKNOWN',
        skills: Array.isArray(item.skills) ? item.skills.join(', ') : (item.skills || 'N/A'),
        siteName: item.siteName || 'N/A',
        totalWorkingHours: (item.totalWorkingHours || 0).toFixed(1),
        averageDailyHours: (item.averageDailyHours || 0).toFixed(1),
      };

      if (type === 'payroll') {
        rowData.monthlySalary = item.monthlySalary || 0;
        rowData.totalDays = (item.totalPresent || 0) + ((item.totalHalfDay || 0) * 0.5);
        rowData.totalEarnings = Math.round(item.totalEarnings || 0);
      } else {
        rowData.totalPresent = item.totalPresent || 0;
        rowData.totalHalfDay = item.totalHalfDay || 0;
        rowData.totalLeave = item.totalLeave || 0;
        rowData.totalAbsent = item.totalAbsent || 0;
      }

      worksheet.addRow(rowData);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    try {
      const existing = await ReportCache.findOne({ cacheKey });
      if (!existing) {
        await ReportCache.create({
          cacheKey,
          reportType: type.toUpperCase(),
          format: 'EXCEL',
          fileBuffer: buffer,
          generatedBy: req.user.id,
        });
      }
    } catch (cacheErr) {
      console.error('[Excel Cache Error]:', cacheErr.message);
    }

    await logReport(req.user.id, `${type.toUpperCase()}_EXCEL`, req.query);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_report.xlsx`);
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

    console.log(`[PDF Export] Initiating generation (v4-fix) for type: ${type}`);
    const data = await getAggregatedData(req.query);
    if (!data || data.length === 0) {
      return ApiResponse.error(res, 'No data detected for the requested boundary.', 404);
    }

    const doc = new PDFDocument({ 
      margin: 40,
      size: 'A4',
      layout: 'landscape',
      bufferPages: true
    });
    
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      try {
        const pdfBuffer = Buffer.concat(buffers);
        
        // Final safety check to avoid DuplicateKey if another request finished first
        const existing = await ReportCache.findOne({ cacheKey });
        if (!existing) {
          await ReportCache.create({
            cacheKey,
            reportType: type.toUpperCase(),
            format: 'PDF',
            fileBuffer: pdfBuffer,
            generatedBy: req.user.id,
          });
        }
        
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=CONSTRUCTSYNC_${type.toUpperCase()}_REPORT.pdf`);
          res.send(pdfBuffer);
        }
      } catch (err) {
        console.error('[PDF Export Pipeline Crash]:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'PDF Generation failed internally' });
        }
      }
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

    // --- TABLE HEADERS HELPER ---
    const drawTableHeader = (yPos) => {
      doc.rect(40, yPos, 760, 25).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      
      doc.text('PERSONNEL ID', 50, yPos + 8);
      doc.text('FULL NAME & SPECIALIZATION', 150, yPos + 8);
      
      if (type === 'payroll') {
        doc.text('MONTHLY SALARY', 350, yPos + 8, { width: 90, align: 'right' });
        doc.text('TOTAL DAYS', 450, yPos + 8, { width: 80, align: 'right' });
        doc.text('TOTAL HOURS', 540, yPos + 8, { width: 80, align: 'right' });
        doc.text('NET EARNINGS (INR)', 640, yPos + 8, { width: 150, align: 'right' });
      } else {
        doc.text('ATTENDANCE (P/H/L/A)', 400, yPos + 8, { width: 150, align: 'center' });
        doc.text('TOTAL HOURS', 560, yPos + 8, { width: 100, align: 'right' });
        doc.text('AVG DAILY', 680, yPos + 8, { width: 100, align: 'right' });
      }
      return yPos + 25;
    };

    // --- TABLE ROWS ---
    let y = 180;
    y = drawTableHeader(y);

    data.forEach((item, index) => {
      // Page break check (Landscape A4 height is ~595pts, leave room for footer)
      if (y > 500) {
        doc.addPage();
        y = 40; // New page top margin
        y = drawTableHeader(y);
      }

      // Alternating row background
      if (index % 2 === 0) {
        doc.rect(40, y, 760, 30).fill('#f1f5f9');
      }
      
      const skillsStr = Array.isArray(item.skills) ? item.skills.join(', ') : (item.skills || 'N/A');

      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(item.labourId || 'N/A', 50, y + 10);
      doc.font('Helvetica').text((item.name || 'UNKNOWN').toUpperCase(), 150, y + 6);
      doc.fillColor('#64748b').fontSize(7).text(skillsStr.toUpperCase(), 150, y + 18);
      
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica');
      if (type === 'payroll') {
        const totalDays = (item.totalPresent || 0) + ((item.totalHalfDay || 0) * 0.5);
        doc.text(`₹ ${(item.monthlySalary || 0).toLocaleString()}`, 350, y + 10, { width: 90, align: 'right' });
        doc.text(`${totalDays.toFixed(1)} DAYS`, 450, y + 10, { width: 80, align: 'right' });
        doc.text(`${(item.totalWorkingHours || 0).toFixed(1)} HRS`, 540, y + 10, { width: 80, align: 'right' });
        doc.fillColor('#15803d').font('Helvetica-Bold').text(`₹ ${Math.round(item.totalEarnings || 0).toLocaleString()}`, 640, y + 10, { width: 150, align: 'right' });
      } else {
        const stats = `${item.totalPresent || 0} / ${item.totalHalfDay || 0} / ${item.totalLeave || 0} / ${item.totalAbsent || 0}`;
        doc.text(stats, 400, y + 10, { width: 150, align: 'center' });
        doc.font('Helvetica-Bold').text(`${(item.totalWorkingHours || 0).toFixed(1)}`, 560, y + 10, { width: 100, align: 'right' });
        doc.font('Helvetica').text(`${(item.averageDailyHours || 0).toFixed(1)}`, 680, y + 10, { width: 100, align: 'right' });
      }
      
      y += 30;
    });

    // --- FOOTER ---
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica');
      doc.text(`CONSTRUCTSYNC INTERNAL DOCUMENT • CLASSIFICATION: CONFIDENTIAL • PAGE ${i + 1 - range.start} OF ${range.count}`, 40, doc.page.height - 30, { align: 'center' });
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
    // Clear cache if data was recently updated/seeded to ensure fresh results
    const { siteId } = req.query;
    if (siteId) {
      await ReportCache.deleteMany({ 'parameters.siteId': siteId });
    }

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

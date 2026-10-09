const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Scan = require('../models/Scan');
const SystemLog = require('../models/SystemLog');
const { protect, authorize } = require('../middleware/auth');
const { reportToPdfBuffer } = require('../utils/simplePdf');


router.post('/generate', protect, authorize('analyst', 'admin'), async (req, res) => {
  try {
    const { title, type, startDate, endDate } = req.body;

    // Validation
    if (!title || !type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, type, start date and end date'
      });
    }

    // Query scans within date range
    const scans = await Scan.find({
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });

    // Generate report data based on type
    let reportData = {};

    switch (type) {
      case 'detection-summary':
        reportData = await generateDetectionSummary(scans);
        break;
      case 'threat-analysis':
        reportData = await generateThreatAnalysis(scans);
        break;
      case 'user-activity':
        reportData = await generateUserActivity(scans);
        break;
      case 'model-performance':
        reportData = await generateModelPerformance(scans);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    // Create report
    const requestedFormat = req.body.format === 'pdf' ? 'pdf' : 'json';

    const report = await Report.create({
      title,
      type,
      dateRange: {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      data: reportData,
      generatedBy: req.user.id,
      format: requestedFormat
    });

    // Log action
    await SystemLog.create({
      userId: req.user.id,
      action: 'report_generated',
      details: `Generated ${type} report: ${title}`,
      metadata: { reportId: report._id },
      ipAddress: req.ip,
      status: 'success'
    });

    if (requestedFormat === 'pdf') {
      const pdf = reportToPdfBuffer(report.toObject());
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.pdf"`);
      return res.status(200).send(pdf);
    }

    res.status(201).json({
      success: true,
      message: 'Report generated successfully',
      report
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report'
    });
  }
});

// Helper function: Detection Summary
async function generateDetectionSummary(scans) {
  const totalScans = scans.length;
  const phishingDetected = scans.filter(s => s.result.isPhishing).length;
  const legitimateMessages = totalScans - phishingDetected;

  // Calculate average confidence
  const avgConfidence = scans.length > 0
    ? scans.reduce((sum, s) => sum + s.result.confidence, 0) / scans.length
    : 0;

  // Language distribution
  const languageDistribution = {
    english: scans.filter(s => s.features.detectedLanguage === 'English').length,
    sinhala: scans.filter(s => s.features.detectedLanguage === 'Sinhala').length,
    codeMixed: scans.filter(s => s.features.isCodeMixed).length
  };

  // Risk level distribution
  const riskLevels = {
    critical: scans.filter(s => s.result.riskLevel === 'critical').length,
    high: scans.filter(s => s.result.riskLevel === 'high').length,
    medium: scans.filter(s => s.result.riskLevel === 'medium').length,
    low: scans.filter(s => s.result.riskLevel === 'low').length
  };

  return {
    totalScans,
    phishingDetected,
    legitimateMessages,
    averageConfidence: Math.round(avgConfidence),
    detectionRate: totalScans > 0 ? Math.round((phishingDetected / totalScans) * 100) : 0,
    languageDistribution,
    riskLevels
  };
}

// Helper function: Threat Analysis
async function generateThreatAnalysis(scans) {
  const phishingScans = scans.filter(s => s.result.isPhishing);

  // Top suspicious keywords
  const keywordCounts = {};
  phishingScans.forEach(scan => {
    if (scan.features.suspiciousKeywords) {
      scan.features.suspiciousKeywords.forEach(keyword => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });
    }
  });

  const topThreats = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pattern, count]) => ({ pattern, count }));

  // URL-based threats
  const urlThreats = phishingScans.filter(s => s.features.hasUrl).length;

  // Credential request threats
  const credentialThreats = phishingScans.filter(s => s.features.requestsCredentials).length;

  // Urgency-based threats
  const urgencyThreats = phishingScans.filter(s => s.features.hasUrgency).length;

  return {
    totalThreats: phishingScans.length,
    topThreats,
    threatCategories: {
      urlBased: urlThreats,
      credentialRequests: credentialThreats,
      urgencyBased: urgencyThreats
    }
  };
}

// Helper function: User Activity
async function generateUserActivity(scans) {
  // Group by user
  const userActivity = {};
  
  for (const scan of scans) {
    const userId = scan.userId.toString();
    if (!userActivity[userId]) {
      userActivity[userId] = {
        totalScans: 0,
        phishingDetected: 0,
        legitimateMessages: 0
      };
    }
    
    userActivity[userId].totalScans++;
    if (scan.result.isPhishing) {
      userActivity[userId].phishingDetected++;
    } else {
      userActivity[userId].legitimateMessages++;
    }
  }

  // Get top active users
  const topUsers = Object.entries(userActivity)
    .sort((a, b) => b[1].totalScans - a[1].totalScans)
    .slice(0, 10)
    .map(([userId, stats]) => ({
      userId,
      ...stats
    }));

  return {
    uniqueUsers: Object.keys(userActivity).length,
    totalActivity: scans.length,
    topUsers
  };
}

// Helper function: Model Performance
async function generateModelPerformance(scans) {
  // Confidence distribution
  const confidenceRanges = {
    '90-100': scans.filter(s => s.result.confidence >= 90).length,
    '70-89': scans.filter(s => s.result.confidence >= 70 && s.result.confidence < 90).length,
    '50-69': scans.filter(s => s.result.confidence >= 50 && s.result.confidence < 70).length,
    '0-49': scans.filter(s => s.result.confidence < 50).length
  };

  // Average processing time
  const avgProcessingTime = scans.length > 0
    ? scans.reduce((sum, s) => sum + (s.processingTime || 0), 0) / scans.length
    : 0;

  // Feature importance (most common features)
  const featureUsage = {
    urlDetection: scans.filter(s => s.features.hasUrl).length,
    keywordDetection: scans.filter(s => s.features.hasSuspiciousKeywords).length,
    urgencyDetection: scans.filter(s => s.features.hasUrgency).length,
    credentialDetection: scans.filter(s => s.features.requestsCredentials).length
  };

  const averageConfidence = scans.length > 0
    ? Math.round(scans.reduce((sum, s) => sum + (s.result?.confidence || 0), 0) / scans.length)
    : 0;

  return {
    totalPredictions: scans.length,
    averageConfidence,
    confidenceDistribution: confidenceRanges,
    averageProcessingTime: Math.round(avgProcessingTime),
    featureUsage
  };
}


router.get('/list', protect, authorize('analyst', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    // Build query
    const query = {};
    if (type) query.type = type;

    // Pagination
    const skip = (page - 1) * limit;

    // Get reports
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('generatedBy', 'name email')
      .select('-__v');

    // Get total count
    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      reports,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: reports.length,
        totalReports: total
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports'
    });
  }
});


router.get('/:id/pdf', protect, authorize('analyst', 'admin'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const pdf = reportToPdfBuffer(report.toObject());
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(report.title || 'phishguard-report')}.pdf"`
    );
    return res.status(200).send(pdf);
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting report PDF'
    });
  }
});

router.get('/:id', protect, authorize('analyst', 'admin'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('generatedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report'
    });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await report.deleteOne();

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting report'
    });
  }
});

module.exports = router;
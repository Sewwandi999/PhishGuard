const express = require('express');
const router = express.Router();
const Scan = require('../models/Scan');
const SystemLog = require('../models/SystemLog');
const phishingDetector = require('../ml/phishingDetector');
const { protect } = require('../middleware/auth');


function normalizeScanInput(body = {}) {
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  return { message, type, sender: body.sender };
}

router.post('/scan-analyze', async (req, res) => {
  try {
    const { message, type, sender } = normalizeScanInput(req.body);

    if (!message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide message and type (email/sms)'
      });
    }

    // Run ML detection
    const detectionResult = await phishingDetector.analyze(message, type, sender);

    res.json({
      success: true,
      result: {
        isPhishing: detectionResult.isPhishing,
        confidence: detectionResult.confidence,
        riskLevel: detectionResult.riskLevel,
        reasoning: detectionResult.explainability.reasoning
      }
    });
  } catch (error) {
    console.error('Scan analyze error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing message'
    });
  }
});


router.post('/analyze', protect, async (req, res) => {
  try {
    const { message, type, sender } = normalizeScanInput(req.body);

    // Validation
    if (!message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a non-empty message and type (email/sms)'
      });
    }

    // Run ML detection
    const detectionResult = await phishingDetector.analyze(message, type, sender);

    // Save scan result
    const scan = await Scan.create({
      userId: req.user.id,
      message,
      type,
      sender: sender || 'Unknown',
      result: {
        isPhishing: detectionResult.isPhishing,
        confidence: detectionResult.confidence,
        riskLevel: detectionResult.riskLevel
      },
      features: detectionResult.features,
      explainability: detectionResult.explainability,
      processingTime: detectionResult.processingTime
    });

    // Log scan action
    await SystemLog.create({
      userId: req.user.id,
      action: 'scan_performed',
      details: `Scanned ${type} message - Result: ${detectionResult.isPhishing ? 'Phishing' : 'Legitimate'}`,
      metadata: {
        scanId: scan._id,
        confidence: detectionResult.confidence,
        riskLevel: detectionResult.riskLevel
      },
      ipAddress: req.ip,
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Message analyzed successfully',
      scanId: scan._id,
      result: {
        isPhishing: detectionResult.isPhishing,
        confidence: detectionResult.confidence,
        riskLevel: detectionResult.riskLevel,
        reasoning: detectionResult.explainability.reasoning
      },
      features: detectionResult.features,
      explainability: detectionResult.explainability,
      processingTime: detectionResult.processingTime
    });
  } catch (error) {
    console.error('Scan error:', error);

    // Log error
    await SystemLog.create({
      userId: req.user.id,
      action: 'scan_performed',
      details: `Scan failed: ${error.message}`,
      ipAddress: req.ip,
      status: 'failure'
    });

    res.status(500).json({
      success: false,
      message: 'Error analyzing message'
    });
  }
});


router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, filter } = req.query;

    const query = { userId: req.user.id };

    if (filter === 'phishing') {
      query['result.isPhishing'] = true;
    } else if (filter === 'legitimate') {
      query['result.isPhishing'] = false;
    }

    const skip = (page - 1) * limit;

    const scans = await Scan.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-__v');

    const total = await Scan.countDocuments(query);

    res.json({
      success: true,
      scans,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: scans.length,
        totalScans: total
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scan history'
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    if (scan.userId.toString() !== req.user.id && !['admin', 'analyst'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this scan'
      });
    }

    res.json({
      success: true,
      scan
    });
  } catch (error) {
    console.error('Get scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scan details'
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    if (scan.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this scan'
      });
    }

    await scan.deleteOne();

    res.json({
      success: true,
      message: 'Scan deleted successfully'
    });
  } catch (error) {
    console.error('Delete scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting scan'
    });
  }
});

router.get('/stats/summary', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const totalScans = await Scan.countDocuments({ userId });
    const phishingCount = await Scan.countDocuments({ userId, 'result.isPhishing': true });
    const legitimateCount = totalScans - phishingCount;

    const avgResult = await Scan.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: null, avgConfidence: { $avg: '$result.confidence' } } }
    ]);

    const averageConfidence = avgResult.length > 0 ? avgResult[0].avgConfidence : 0;

    const recentScans = await Scan.find({ userId })
      .sort({ timestamp: -1 })
      .limit(5)
      .select('message type result.isPhishing result.confidence timestamp');

    res.json({
      success: true,
      stats: {
        totalScans,
        phishingCount,
        legitimateCount,
        averageConfidence: Math.round(averageConfidence),
        recentScans
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

module.exports = router;

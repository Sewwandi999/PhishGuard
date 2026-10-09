const express = require('express');
const router = express.Router();
const Dataset = require('../models/Dataset');
const SystemLog = require('../models/SystemLog');
const { protect, authorize } = require('../middleware/auth');


router.post('/add', protect, authorize('analyst', 'admin'), async (req, res) => {
  try {
    const { message, label, language, type, source } = req.body;

    // Validation
    if (!message || !label || !language || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create dataset sample
    const dataset = await Dataset.create({
      message,
      label,
      language,
      type,
      source: source || 'manual',
      addedBy: req.user.id
    });

    // Log action
    await SystemLog.create({
      userId: req.user.id,
      action: 'dataset_added',
      details: `Added ${label} sample to dataset`,
      metadata: { datasetId: dataset._id, language, type },
      ipAddress: req.ip,
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Dataset sample added successfully',
      dataset
    });
  } catch (error) {
    console.error('Add dataset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding dataset sample'
    });
  }
});


router.get('/list', protect, authorize('analyst', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, label, language, type } = req.query;

    // Build query
    const query = {};
    if (label) query.label = label;
    if (language) query.language = language;
    if (type) query.type = type;

    // Pagination
    const skip = (page - 1) * limit;

    // Get dataset
    const datasets = await Dataset.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('addedBy', 'name email')
      .select('-__v');

    // Get total count
    const total = await Dataset.countDocuments(query);

    res.json({
      success: true,
      datasets,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: datasets.length,
        totalSamples: total
      }
    });
  } catch (error) {
    console.error('Get dataset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dataset'
    });
  }
});


router.get('/stats', protect, authorize('analyst', 'admin'), async (req, res) => {
  try {
    // Total samples
    const total = await Dataset.countDocuments();

    // By label
    const labelDistribution = await Dataset.aggregate([
      { $group: { _id: '$label', count: { $sum: 1 } } }
    ]);

    // By language
    const languageDistribution = await Dataset.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } }
    ]);

    // By type
    const typeDistribution = await Dataset.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Verified samples
    const verifiedCount = await Dataset.countDocuments({ isVerified: true });

    // Used in training
    const trainedCount = await Dataset.countDocuments({ usedInTraining: true });

    res.json({
      success: true,
      stats: {
        total,
        verified: verifiedCount,
        trained: trainedCount,
        labelDistribution: labelDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        languageDistribution: languageDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        typeDistribution: typeDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get dataset stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dataset statistics'
    });
  }
});

// @route   PUT /api/dataset/:id/verify
// @desc    Mark dataset sample as verified
// @access  Private (Admin)
router.put('/:id/verify', protect, authorize('admin'), async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset sample not found'
      });
    }

    dataset.isVerified = true;
    await dataset.save();

    res.json({
      success: true,
      message: 'Dataset sample verified successfully',
      dataset
    });
  } catch (error) {
    console.error('Verify dataset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying dataset sample'
    });
  }
});

// @route   DELETE /api/dataset/:id
// @desc    Delete dataset sample
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset sample not found'
      });
    }

    await dataset.deleteOne();

    // Log action
    await SystemLog.create({
      userId: req.user.id,
      action: 'dataset_deleted',
      details: `Deleted dataset sample ${req.params.id}`,
      ipAddress: req.ip,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Dataset sample deleted successfully'
    });
  } catch (error) {
    console.error('Delete dataset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting dataset sample'
    });
  }
});

module.exports = router;
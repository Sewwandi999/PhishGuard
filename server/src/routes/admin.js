const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Scan = require('../models/Scan');
const Dataset = require('../models/Dataset');
const SystemLog = require('../models/SystemLog');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Pagination
    const skip = (page - 1) * limit;

    // Get users
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-password -__v');

    // Get total count
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: users.length,
        totalUsers: total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});


router.get('/stats', protect, authorize('admin', 'analyst'), async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Scan statistics
    const totalScans = await Scan.countDocuments();
    const phishingDetected = await Scan.countDocuments({ 'result.isPhishing': true });
    const todayScans = await Scan.countDocuments({
      timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    // Dataset statistics
    const totalDatasetSamples = await Dataset.countDocuments();
    const verifiedSamples = await Dataset.countDocuments({ isVerified: true });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentScans = await Scan.find({ timestamp: { $gte: sevenDaysAgo } })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('userId', 'name email');

    // Detection rate by day (last 7 days)
    const detectionTrend = await Scan.aggregate([
      {
        $match: { timestamp: { $gte: sevenDaysAgo } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          total: { $sum: 1 },
          phishing: {
            $sum: { $cond: ['$result.isPhishing', 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          byRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        scans: {
          total: totalScans,
          phishingDetected,
          legitimateMessages: totalScans - phishingDetected,
          today: todayScans,
          detectionRate: totalScans > 0 
            ? Math.round((phishingDetected / totalScans) * 100) 
            : 0
        },
        dataset: {
          total: totalDatasetSamples,
          verified: verifiedSamples,
          unverified: totalDatasetSamples - verifiedSamples
        },
        recentActivity: recentScans,
        detectionTrend
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


router.get('/logs', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, status, userId } = req.query;

    // Build query
    const query = {};
    if (action) query.action = action;
    if (status) query.status = status;
    if (userId) query.userId = userId;

    // Pagination
    const skip = (page - 1) * limit;

    // Get logs
    const logs = await SystemLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'name email')
      .select('-__v');

    // Get total count
    const total = await SystemLog.countDocuments(query);

    res.json({
      success: true,
      logs,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: logs.length,
        totalLogs: total
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching logs'
    });
  }
});


router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // Log action
    await SystemLog.create({
      userId: req.user.id,
      action: 'user_updated',
      details: `Updated user ${user.email}`,
      metadata: { updatedUserId: user._id, changes: req.body },
      ipAddress: req.ip,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});


router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.deleteOne();

    // Log action
    await SystemLog.create({
      userId: req.user.id,
      action: 'user_deleted',
      details: `Deleted user ${user.email}`,
      metadata: { deletedUserId: user._id },
      ipAddress: req.ip,
      status: 'success'
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});


router.post('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    // Log action
    await SystemLog.create({
      userId: req.user.id,
      action: 'user_created',
      details: `Created user ${email} with role ${role}`,
      metadata: { createdUserId: user._id },
      ipAddress: req.ip,
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

module.exports = router;

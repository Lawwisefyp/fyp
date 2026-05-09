const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

// Import Models
const Case = require('../models/Case');
const Client = require('../models/Client');
const Document = require('../models/Document');
const Draft = require('../models/Draft');
const Connection = require('../models/Connection');
const History = require('../models/History');
const ChatSession = require('../models/ChatSession');

// @route   GET /api/analytics
// @desc    Get comprehensive lawyer analytics
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const lawyerId = req.lawyer._id;

        // 1. Practice Overview (Total Stats)
        const totalCases = await Case.countDocuments({ lawyerId });
        
        // Count unique clients by email across all cases for this lawyer
        const uniqueClientsCount = (await Case.distinct('clientEmail', { lawyerId })).length;
        
        const totalDocuments = await Document.countDocuments({ lawyerId });
        
        // Connections (Accepted only)
        const connections = await Connection.countDocuments({
            $or: [{ requester: lawyerId }, { recipient: lawyerId }],
            status: 'accepted'
        });

        // 2. Case Distribution by Status
        const statusStats = await Case.aggregate([
            { $match: { lawyerId: new mongoose.Types.ObjectId(lawyerId) } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // 3. Case Distribution by Type (Specialization)
        const typeStats = await Case.aggregate([
            { $match: { lawyerId: new mongoose.Types.ObjectId(lawyerId) } },
            { $group: { _id: '$caseType', count: { $sum: 1 } } }
        ]);

        // 4. Productivity & AI Usage
        const totalDrafts = await Draft.countDocuments({ lawyerId });
        const videosWatched = await History.countDocuments({ lawyerId });
        const aiChatSessions = await ChatSession.countDocuments({ lawyerId });

        // 5. Client Growth (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const clientGrowth = await Case.aggregate([
            { 
                $match: { 
                    lawyerId: new mongoose.Types.ObjectId(lawyerId),
                    createdDate: { $gte: sixMonthsAgo } 
                } 
            },
            {
                $group: {
                    _id: { 
                        month: { $month: '$createdDate' }, 
                        year: { $year: '$createdDate' } 
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        console.log(`[Analytics] Fetching data for Lawyer ID: ${lawyerId}`);

        // 6. Recent Activity (Last 5 actions)
        const recentCases = await Case.find({ lawyerId })
            .sort({ createdAt: -1, createdDate: -1 }) // Sort by both just in case
            .limit(3)
            .select('title client status createdDate createdAt');
        
        console.log(`[Analytics] Found ${recentCases.length} recent cases`);

        const recentHistory = await History.find({ lawyerId })
            .sort({ watchedAt: -1, createdAt: -1 })
            .limit(3)
            .select('title watchedAt createdAt');

        console.log(`[Analytics] Found ${recentHistory.length} history records`);

        // 7. Upcoming Deadlines (Next 3)
        const allCasesWithDeadlines = await Case.find({ 
            lawyerId,
            'deadlines.isCompleted': false 
        }).select('title deadlines');

        const upcomingDeadlines = [];
        const today = new Date();

        allCasesWithDeadlines.forEach(c => {
            if (c.deadlines && Array.isArray(c.deadlines)) {
                c.deadlines.forEach(d => {
                    if (!d.isCompleted && new Date(d.dueDate) >= today) {
                        upcomingDeadlines.push({
                            caseTitle: c.title,
                            deadlineTitle: d.title,
                            dueDate: d.dueDate,
                            description: d.description
                        });
                    }
                });
            }
        });

        // Sort by date and take top 3
        const sortedDeadlines = upcomingDeadlines
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 3);

        res.json({
            success: true,
            data: {
                overview: {
                    totalCases,
                    totalClients: uniqueClientsCount,
                    totalDocuments,
                    connections
                },
                distribution: {
                    status: statusStats,
                    types: typeStats
                },
                aiUsage: {
                    totalDrafts,
                    videosWatched,
                    aiChatSessions
                },
                growth: clientGrowth,
                upcomingDeadlines: sortedDeadlines,
                recentActivity: {
                    cases: recentCases,
                    learning: recentHistory
                }
            }
        });

    } catch (error) {
        console.error('Analytics Fetch Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics data' });
    }
});

module.exports = router;

import express from 'express';
import {
  getDashboardAnalytics,
  getMonthlyTrends,
  getCategoryAnalysis,
  getCashflow,
  getSpendingPatterns
} from '../controllers/analytics.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardAnalytics);
router.get('/trends', getMonthlyTrends);
router.get('/categories', getCategoryAnalysis);
router.get('/cashflow', getCashflow);
router.get('/patterns', getSpendingPatterns);

export default router;

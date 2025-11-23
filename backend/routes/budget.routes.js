import express from 'express';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  recalculateBudgets
} from '../controllers/budget.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getBudgets)
  .post(createBudget);

router.post('/recalculate', recalculateBudgets);

router.route('/:id')
  .put(updateBudget)
  .delete(deleteBudget);

export default router;

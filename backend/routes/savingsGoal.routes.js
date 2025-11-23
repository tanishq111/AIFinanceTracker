import express from 'express';
import {
  getSavingsGoals,
  getSavingsGoal,
  createSavingsGoal,
  updateSavingsGoal,
  addToSavingsGoal,
  deleteSavingsGoal
} from '../controllers/savingsGoal.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSavingsGoals)
  .post(createSavingsGoal);

router.route('/:id')
  .get(getSavingsGoal)
  .put(updateSavingsGoal)
  .delete(deleteSavingsGoal);

router.post('/:id/add', addToSavingsGoal);

export default router;

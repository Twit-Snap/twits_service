import express from 'express';
import {
  createSnap,
  deleteSnapById,
  getAllSnaps,
  getSnapById,
  getTotalAmount,
  getTrendingTopics
} from '../controllers/snapController';

const router = express.Router();

router.post('/', createSnap);
router.get('/amount', getTotalAmount);
router.get('/trending', getTrendingTopics);
router.get('/', getAllSnaps);
router.get('/:id', getSnapById);
router.delete('/:id', deleteSnapById);

export default router;

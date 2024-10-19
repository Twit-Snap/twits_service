import express from 'express';
import {
  createSnap,
  deleteSnapById,
  getAllSnaps,
  getSnapById,
  getTotalAmount
} from '../controllers/snapController';

const router = express.Router();

router.post('/', createSnap);
router.post('/amount', getTotalAmount);
router.get('/', getAllSnaps);
router.get('/:id', getSnapById);
router.delete('/:id', deleteSnapById);

export default router;

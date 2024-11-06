import express from 'express';
import {
  createSnap,
  deleteSnapById,
  getAllSnaps,
  getSnapById,
  getTotalAmount,
  editSnapById
} from '../controllers/snapController';

const router = express.Router();

router.post('/', createSnap);
router.get('/amount', getTotalAmount);
router.get('/', getAllSnaps);
router.get('/:id', getSnapById);
router.delete('/:id', deleteSnapById);
router.patch('/:id', editSnapById);

export default router;

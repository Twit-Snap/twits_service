import express from 'express';
import { createSnap, getAllSnaps } from '../controllers/snapController';

const router = express.Router();

router.post('/', createSnap);
router.get('/', getAllSnaps);

export default router;
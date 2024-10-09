import express from 'express';
import {
  createSnap,
  deleteSnapById,
  getAllSnaps,
  getSnapById,
  getSnapsByUsersIds,
  getSnapsByUsername
} from '../controllers/snapController';

const router = express.Router();

router.post('/', createSnap);
router.get('/', getAllSnaps);
router.get('/:id', getSnapById);
router.get('/by_username/:username',getSnapsByUsername);
router.delete('/:id', deleteSnapById);
router.post('/by_users', getSnapsByUsersIds);

export default router;

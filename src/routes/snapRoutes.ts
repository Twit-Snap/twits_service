import express from 'express';
import {
  createSnap,
  deleteSnapById,
  getAllSnaps,
  getSnapById,
  getSnapsByUsersIds
} from '../controllers/snapController';

const router = express.Router();

router.post('/', createSnap);
router.get('/', getAllSnaps);
router.get('/:id', getSnapById);
router.delete('/:id', deleteSnapById);

router.post('/users', async (req, res, next) => {
  try {
    const { usersIds } = req.body;

    const result = await getSnapsByUsersIds(usersIds);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

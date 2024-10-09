import express from 'express';
import { addLike, getLikesByTwit, removeLike } from '../controllers/likeController';

const router = express.Router();

router.get('/:twitId', getLikesByTwit);
router.post('/', addLike);
router.delete('/', removeLike);

export default router;

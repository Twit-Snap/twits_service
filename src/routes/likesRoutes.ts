import express from 'express';
import { addLike, getLikesByTwit, getLikesByUser, removeLike } from '../controllers/likeController';

const router = express.Router();

router.get('/twits/:twitId', getLikesByTwit);
router.post('/', addLike);
router.delete('/', removeLike);
router.get('/users/:userId', getLikesByUser);

export default router;

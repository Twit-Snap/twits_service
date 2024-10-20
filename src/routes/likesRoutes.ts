import express from 'express';
import { addLike, getLikesByUser, removeLike } from '../controllers/likeController';

const router = express.Router();

// router.get('/twits/:twitId', getLikesByTwit);
router.post('/', addLike);
router.delete('/', removeLike);
router.get('/user/', getLikesByUser);

export default router;

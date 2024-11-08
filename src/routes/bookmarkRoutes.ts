import express from 'express';
import { addBookmark, getBookmarksByTwit, removeBookmark } from '../controllers/bookmarkController';

const router = express.Router();

router.get('/twits/:twitId', getBookmarksByTwit);
router.post('/', addBookmark);
router.delete('/', removeBookmark);

export default router;

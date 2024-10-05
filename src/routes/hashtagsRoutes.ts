import express from 'express';
import {
  getSnapsByHashtag
} from '../controllers/snapController';

const router = express.Router();

router.get('/:hashtag', getSnapsByHashtag);

export default router;
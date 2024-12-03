import express from 'express';
import {
  redirectToTwit
} from '../controllers/twitShareRedirectionController';

const router = express.Router();

router.get('/:twitId', redirectToTwit);

export default router;
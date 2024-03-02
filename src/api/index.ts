import express from 'express';

import MessageResponse from '../interfaces/MessageResponse';
import test from './test-route';

const router = express.Router();

router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({message: 'api index'});
});

router.use('/test', test);

export default router;

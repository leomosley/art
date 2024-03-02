import express from 'express';

import MessageResponse from '../interfaces/MessageResponse';
import test from './test-route';

const router = express.Router();

router.get<{}, MessageResponse>('/', (req, res) => {
  res.set('api index');
});

router.use('/', test);

export default router;

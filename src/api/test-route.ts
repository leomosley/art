import express from 'express';
import MessageResponse from '../interfaces/MessageResponse';

const router = express.Router();


router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({message: 'test route'});
});

export default router;

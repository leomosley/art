import express from 'express';

const router = express.Router();

type TestResponse = string[];

router.get<{}, TestResponse>('/', (req, res) => {
  res.set('test route');
});

export default router;

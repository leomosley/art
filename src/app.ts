import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

import { notFound, errorHandler, redirect } from './middlewares';
import api from './api';

require('dotenv').config();

const app = express();

app.use(redirect);

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/', api);

app.use(notFound);
app.use(errorHandler);

export default app;

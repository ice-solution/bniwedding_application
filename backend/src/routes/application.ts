import express from 'express';
import { submitApplication } from '../controllers/application.js';

export const applicationRouter = express.Router();

applicationRouter.post('/application/submit', submitApplication);

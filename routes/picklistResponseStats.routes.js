import express from 'express';
import { getPicklistResponses } from '../controllers/picklistStats.controller.js';
const router = express.Router();

router.post('/stats', getPicklistResponses);

export default router;

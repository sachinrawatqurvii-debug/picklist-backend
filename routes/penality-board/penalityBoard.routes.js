import express from 'express';
import {
  addMistake,
  getMistakeReport,
} from '../../controllers/penality-board/penalityBoard.controller.js';

const router = express.Router();

router.post('/', addMistake);
router.get('/report', getMistakeReport);

export default router;

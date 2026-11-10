import { Router } from 'express';
import { createQrWithUrl, getQrWithUrl } from '../../controllers/QrWithUrl/qrWithUrl.controller.js';

const router = Router();

router.post('/', createQrWithUrl);
router.get('/', getQrWithUrl);

export default router;

import exress from "express";
import { report, secondAttempReport } from "../controllers/secondAttemptReprot.controller.js";
const router = exress.Router();

router.get("/send_mail", secondAttempReport);
router.get("/report", report);

export default router;
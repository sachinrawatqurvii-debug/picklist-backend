import express from "express";
import { sendNotificationToEmail, health } from "../controllers/orderNotifier.controller.js";
import { exportCSV, generatePDF } from "../controllers/exportController.js";
const router = express.Router();

router.route("/send").post(sendNotificationToEmail);
router.route("/health").get(health);

// router.get("/export/pdf", generatePDF);

// Export CSV for cutting / up / down
// router.get("/export/csv/:type", exportCSV);



export default router

import express from "express";
import sendNotificationToEmail from "../controllers/orderNotifier.controller.js"
const router = express();

router.route("/send").post(sendNotificationToEmail);

export default router
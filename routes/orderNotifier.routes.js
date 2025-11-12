import express from "express";
import { sendNotificationToEmail, health } from "../controllers/orderNotifier.controller.js";

const router = express.Router();

router.route("/send").post(sendNotificationToEmail);
router.route("/health").get(health);



export default router


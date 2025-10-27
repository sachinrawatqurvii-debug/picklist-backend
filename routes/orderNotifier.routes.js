import express from "express";
import sendNotificationToEmail from "../controllers/orderNotifier.controller.js"
const router = express.Router();

router.route("/send").post(sendNotificationToEmail);
router.route("/health").get({health:true});


export default router

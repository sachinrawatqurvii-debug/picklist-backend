import express from "express";
import { createBulkPicklist, getAllPicklists, getPicklistByPicklistId } from "../controllers/picklist.controller.js";
import { health, sendNotificationToEmail } from "../controllers/orderNotifier.controller.js";
const router = express.Router();

router.route("/create-picklist").post(createBulkPicklist);
router.route("/picklist-response").get(getAllPicklists);
router.route("/picklist-by-id").get(getPicklistByPicklistId);
router.route("/notification").get(health);
router.route("/send").post(sendNotificationToEmail);

export default router;
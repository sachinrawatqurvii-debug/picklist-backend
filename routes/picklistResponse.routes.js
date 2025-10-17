import express from "express";
import { createBulkPicklistResponse, getResponsesByPicklistId } from "../controllers/picklistResponse.controller.js";

const router = express.Router();

router.route("/create-response").post(createBulkPicklistResponse)
router.route("/picklist-id").get(getResponsesByPicklistId);

export default router;
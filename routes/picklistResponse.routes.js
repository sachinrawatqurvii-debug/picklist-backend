import express from "express";
import { createBulkPicklistResponse, getResponsesByPicklistId, updatePicklistResponse } from "../controllers/picklistResponse.controller.js";
const router = express.Router();

router.route("/create-response").post(createBulkPicklistResponse)
router.route("/picklist-id").get(getResponsesByPicklistId);


router.route("/update").post(updatePicklistResponse)

export default router;

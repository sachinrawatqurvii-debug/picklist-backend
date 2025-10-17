import express from "express";
import { createBulkPicklist, getAllPicklists, getPicklistByPicklistId } from "../controllers/picklist.controller.js";
const router = express.Router();

router.route("/create-picklist").post(createBulkPicklist);
router.route("/picklist-response").get(getAllPicklists);
router.route("/picklist-by-id").get(getPicklistByPicklistId);

export default router;
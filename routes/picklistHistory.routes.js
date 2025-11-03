import express from "express";
import {
    createPicklistHistory,
    getPicklistHistoryByPicklist,
    getPicklistHistoryByPicklistId,
    updatePicklistStatus,
} from "../controllers/picklistHistory.controller.js";
const router = express.Router();
router.post("/", createPicklistHistory);
router.get("/", getPicklistHistoryByPicklistId);
router.get("/id", getPicklistHistoryByPicklist);
router.put("/update/:picklist_id", updatePicklistStatus);
export default router;

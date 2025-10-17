import express from "express";
import {
    createPicklistHistory,
    getPicklistHistoryByPicklistId,
} from "../controllers/picklistHistory.controller.js";

const router = express.Router();
router.post("/", createPicklistHistory);
router.get("/", getPicklistHistoryByPicklistId);

export default router;

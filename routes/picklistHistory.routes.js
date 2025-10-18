import express from "express";
import {
    createPicklistHistory,
    getPicklistHistoryByPicklist,
    getPicklistHistoryByPicklistId,
} from "../controllers/picklistHistory.controller.js";

const router = express.Router();
router.post("/", createPicklistHistory);
router.get("/", getPicklistHistoryByPicklistId);
router.get("/id", getPicklistHistoryByPicklist);

export default router;

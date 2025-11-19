import express from "express";
import { createPicklistAlterationHistory, getPicklistAlterationHistoryByPicklist, getPicklistAlterationHistoryByPicklistId, updatePicklistAlterationStatus } from "../controllers/picklistAlter.controller.js";

const router = express.Router();
router.post("/", createPicklistAlterationHistory);
router.get("/", getPicklistAlterationHistoryByPicklistId);
router.get("/id", getPicklistAlterationHistoryByPicklist);
router.put("/update", updatePicklistAlterationStatus);
export default router;

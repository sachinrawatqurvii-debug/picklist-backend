import express from "express";
import { createPicklistAlterationHistory, getPicklistAlterationHistoryByPicklist, getPicklistAlterationHistoryByPicklistId, updatePicklistAlterationCuttingStatus, updatePicklistAlterationStatus } from "../controllers/picklistAlter.controller.js";

const router = express.Router();
router.post("/", createPicklistAlterationHistory);
router.get("/", getPicklistAlterationHistoryByPicklistId);
router.get("/id", getPicklistAlterationHistoryByPicklist);
router.put("/update", updatePicklistAlterationStatus);
router.put("/update_cutting", updatePicklistAlterationCuttingStatus);
export default router;

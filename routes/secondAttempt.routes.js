import express from "express";
import { getSecondAttemptByPicklist, upsertSecondAttempt } from "../controllers/secondAttemp.controller.js";

const router = express.Router();

router.post("/upsert", upsertSecondAttempt);
router.get("/:picklist_id", getSecondAttemptByPicklist);

export default router;

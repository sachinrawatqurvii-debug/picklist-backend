import express from "express";
import { filterSecondAttemptByDate, getSecondAttemptByPicklist, upsertSecondAttempt } from "../controllers/secondAttemp.controller.js";

const router = express.Router();

router.post("/upsert", upsertSecondAttempt);
router.get("/date_filter", filterSecondAttemptByDate);
router.get("/:picklist_id", getSecondAttemptByPicklist);


export default router;

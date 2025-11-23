import express from "express";
import { addClaim, getClaimReport, getClaims, updateClaimStatus } from "../controllers/claim.controller.js";


const router = express.Router();

router.post("/add", addClaim);
router.get("/", getClaims);
router.get("/reports", getClaimReport);
router.put("/update_status", updateClaimStatus);

export default router;

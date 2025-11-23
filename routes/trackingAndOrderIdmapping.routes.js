import express from "express";
import { addMapping, bulkDeleteByOrderIds, getMapping } from "../controllers/trackingAndOrderIdMapping.controller.js";


const router = express.Router();

router.post("/add", addMapping);
router.get("/get", getMapping);
router.delete("/bulk_delete", bulkDeleteByOrderIds);

export default router;

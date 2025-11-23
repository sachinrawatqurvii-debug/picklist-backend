import express from "express";
import {
    addCancelledOrder,
    getCancelledOrders,
    updateCancelledOrder
}
    from "../controllers/shopifyCancelledOrders.controllers.js";


const router = express.Router();

router.post("/add", addCancelledOrder);
router.get("/list", getCancelledOrders);
router.put("/update/:id", updateCancelledOrder);

export default router;

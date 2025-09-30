import express from "express";
import { submitManualPayment } from "../controllers/paymentController.js";
import { paymentReceiptUpload } from "../middlewares/upload.js";

const router = express.Router();

// Payment route (memory upload -> base64 store)
router.post("/payments/manual", paymentReceiptUpload.single("paymentProof"), submitManualPayment);

export default router;

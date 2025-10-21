import express from "express";
import { createInvoice, getInvoices, updateInvoice, deleteInvoice, approveInvoice, rejectInvoice } from "../controllers/invoiceController.js";
import { getPaymentProofByInvoice } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/invoices", createInvoice);
router.get("/invoices", getInvoices);
router.get("/invoices/:id/proof", getPaymentProofByInvoice);
router.put("/invoices/:id", updateInvoice);
router.delete("/invoices/:id", deleteInvoice);
router.patch("/invoices/:id/approve", approveInvoice);
router.patch("/invoices/:id/reject", rejectInvoice);

export default router; 


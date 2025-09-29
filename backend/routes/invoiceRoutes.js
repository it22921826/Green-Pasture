import express from "express";
import { createInvoice, getInvoices, updateInvoice, deleteInvoice } from "../controllers/invoiceController.js";

const router = express.Router();

router.post("/invoices", createInvoice);
router.get("/invoices", getInvoices);
router.put("/invoices/:id", updateInvoice);
router.delete("/invoices/:id", deleteInvoice);

export default router; 


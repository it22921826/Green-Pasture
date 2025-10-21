import Invoice from "../models/invoice.js";
import nodemailer from "nodemailer";
import { formatCurrency, CURRENCY_SYMBOL } from "../utils/currency.js";

const formatAmount = (amt) => formatCurrency(amt, { withSymbol: true });

const generateInvoiceNumber = async () => {
  while (true) {
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
    let newNumber;
    if (!lastInvoice) {
      newNumber = "INV001";
    } else {
      const lastNumber = parseInt((lastInvoice.invoiceNumber || "INV000").replace("INV", ""), 10) || 0;
      newNumber = `INV${String(lastNumber + 1).padStart(3, "0")}`;
    }
    const exists = await Invoice.findOne({ invoiceNumber: newNumber });
    if (!exists) return newNumber;
  }
};

export const createInvoice = async (req, res) => {
  try {
    const { customerName, email, amount, roomNo } = req.body;
    const invoiceNumber = await generateInvoiceNumber();
    const invoice = await Invoice.create({ invoiceNumber, customerName, email, amount, roomNo });
    // Email intentionally NOT sent here anymore; it's deferred to approval stage.
    res.status(201).json({ success: true, invoice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Other CRUD controllers
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find();
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /invoices/:id/approve -> mark invoice as paid/approved
export const approveInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'approved' || invoice.status === 'paid') {
      return res.json({ message: 'Invoice already approved', invoice });
    }
    invoice.status = 'approved';
    invoice.amountPaid = invoice.amount; // assume full payment on approval
    invoice.paidAt = new Date();
    await invoice.save();
    // Send approval email
    if (invoice.email) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: { user: process.env.SENDER_EMAIL, pass: process.env.EMAIL_PASSWORD }
        });
        await transporter.sendMail({
          from: process.env.SENDER_EMAIL,
          to: invoice.email,
          subject: `Invoice ${invoice.invoiceNumber} Approved`,
          html: `
            <h2>Invoice Approved</h2>
            <p>Dear ${invoice.customerName},</p>
            <p>Your payment has been approved. Here are the details:</p>
            <ul>
              <li>Invoice Number: ${invoice.invoiceNumber}</li>
              <li>Amount: ${formatAmount(invoice.amount)}</li>
              <li>Status: Approved</li>
              <li>Approved At: ${invoice.paidAt.toLocaleString()}</li>
            </ul>
            <p>Thank you for choosing our hotel.</p>
          `
        });
      } catch (mailErr) {
        console.error('[approveInvoice] Email send failed:', mailErr);
      }
    }
    res.json({ message: 'Invoice approved', invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /invoices/:id/reject -> mark invoice as rejected
export const rejectInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'rejected') {
      return res.json({ message: 'Invoice already rejected', invoice });
    }
    invoice.status = 'rejected';
    // ensure no paidAt if rejecting
    invoice.paidAt = undefined;
    await invoice.save();
    // Send rejection email (exact requested format)
    if (invoice.email) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: { user: process.env.SENDER_EMAIL, pass: process.env.EMAIL_PASSWORD }
        });
        await transporter.sendMail({
          from: process.env.SENDER_EMAIL,
          to: invoice.email,
          subject: `Invoice ${invoice.invoiceNumber} Rejected`,
          html: `
            <h2>Invoice Rejected</h2>
            <p>Dear ${invoice.customerName},</p>
            <p>Unfortunately, your payment could not be approved. Details:</p>
            <ul>
              <li>Invoice Number: ${invoice.invoiceNumber}</li>
              <li>Amount: ${formatAmount(invoice.amount)}</li>
              <li>Status: Rejected</li>
              <li>Rejected At: ${new Date().toLocaleString()}</li>
            </ul>
            <p>Please contact support for further assistance.</p>
          `
        });
      } catch (mailErr) {
        console.error('[rejectInvoice] Email send failed:', mailErr);
      }
    }
    res.json({ message: 'Invoice rejected', invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

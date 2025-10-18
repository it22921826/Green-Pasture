import Payment from "../models/payment.js";
import nodemailer from "nodemailer";
import { formatCurrency } from "../utils/currency.js";
import Invoice from "../models/invoice.js";
import { broadcastEvent } from "../index.js";
import path from 'path';
const formatAmount = (v) => formatCurrency(v, { withSymbol: true });

// Controller for manual payment submission
export const submitManualPayment = async (req, res) => {
  try {
    const { customerName, amount, email } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Convert uploaded file (memoryStorage) to base64 data URI for DB embedding
    let paymentProofDataUri = '';
    try {
      if (req.file.buffer) {
        const base64 = req.file.buffer.toString('base64');
        paymentProofDataUri = `data:${req.file.mimetype};base64,${base64}`;
      }
    } catch (e) {
      console.warn('[payment] failed to encode file, will fallback to filename reference', e.message);
    }

    // Create a new invoice (simple incremental number)
    const last = await Invoice.findOne().sort({ createdAt: -1 });
    const nextNum = (() => {
      const lastNumber = parseInt((last?.invoiceNumber || 'INV000').replace('INV',''), 10) || 0;
      return `INV${String(lastNumber + 1).padStart(3,'0')}`;
    })();
  const invoice = await Invoice.create({ invoiceNumber: nextNum, customerName, email, amount, status: 'pending' });

    // Save payment to DB
    const payment = await Payment.create({
      invoiceId: invoice._id,
      customerName,
      amount,
      email,
      paymentProof: paymentProofDataUri || req.file.filename,
      status: "pending",
      method: "manual_upload",
    });

    broadcastEvent?.('invoice.created', { id: invoice._id, invoiceNumber: invoice.invoiceNumber });
    broadcastEvent?.('payment.created', { id: payment._id, invoiceId: invoice._id });

    // Send confirmation email to customer
    if (email) {
      try {
        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.SENDER_EMAIL,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        const mailOptions = {
          from: process.env.SENDER_EMAIL,
          to: email,
          subject: `Payment Submitted Successfully`,
          html: `
            <h2>Payment Received</h2>
            <p>Dear ${customerName},</p>
            <p>We have received your payment submission.</p>
            <ul>
              <li>Amount: ${formatAmount(amount)}</li>
              <li>Status: Pending Verification</li>
            </ul>
            <p>Thank you for your payment!</p>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email}`);
      } catch (err) {
        console.error("Failed to send email:", err);
      }
    }

    res.status(201).json({
      success: true,
      message: "Payment submitted successfully",
      data: payment,
      invoice,
      // If base64 stored, we still include fileUrl for backward compatibility (may not exist on disk now)
      fileUrl: paymentProofDataUri ? undefined : `/uploads/${req.file.filename}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Payment submission failed", error: err.message });
  }
};

// Fetch payment proof by invoice id
export const getPaymentProofByInvoice = async (req, res) => {
  try {
    const { id } = req.params; // invoice id
    // First try direct link
    let payment = await Payment.findOne({ invoiceId: id }).lean();
    // Fallback for historical data: match by invoice email+amount
    if (!payment) {
      const invoice = await Invoice.findById(id).lean();
      if (invoice?.email && typeof invoice.amount === 'number') {
        payment = await Payment.findOne({ email: invoice.email, amount: invoice.amount })
          .sort({ date: -1, _id: -1 })
          .lean();
      }
    }
    if (!payment || !payment.paymentProof) {
      return res.status(404).json({ success: false, message: 'No payment proof found for this invoice' });
    }
    // If stored as base64 data URI, return directly; else construct static URL
    const isDataUri = payment.paymentProof.startsWith('data:');
    const proof = isDataUri
      ? payment.paymentProof
      : `${req.protocol}://${req.get('host')}/uploads/${payment.paymentProof}`;
    // Extract contentType for frontend rendering
    let contentType = undefined;
    if (isDataUri) {
      const m = payment.paymentProof.match(/^data:([^;]+);base64,/);
      if (m) contentType = m[1];
    } else {
      const ext = path.extname(payment.paymentProof || '').toLowerCase();
      const map = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf' };
      contentType = map[ext];
    }
    res.json({ success: true, proof, contentType });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

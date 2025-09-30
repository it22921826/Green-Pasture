import Payment from "../models/payment.js";
import nodemailer from "nodemailer";
import { formatCurrency } from "../utils/currency.js";
import Invoice from "../models/invoice.js";
import { broadcastEvent } from "../index.js";
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

    // 1. Create a new invoice (simple incremental number)
    const last = await Invoice.findOne().sort({ createdAt: -1 });
    const nextNum = (() => {
      const lastNumber = parseInt((last?.invoiceNumber || 'INV000').replace('INV',''), 10) || 0;
      return `INV${String(lastNumber + 1).padStart(3,'0')}`;
    })();
    const invoice = await Invoice.create({ invoiceNumber: nextNum, customerName, email, amount, status: 'pending' });

    // 2. Save payment to DB
    const payment = await Payment.create({
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

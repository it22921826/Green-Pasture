import Payment from "../models/payment.js";
import nodemailer from "nodemailer";
import { formatCurrency } from "../utils/currency.js";
const formatAmount = (v) => formatCurrency(v, { withSymbol: true });

// Controller for manual payment submission
export const submitManualPayment = async (req, res) => {
  try {
    const { customerName, amount, email } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Save payment to DB
    const payment = await Payment.create({
      customerName,
      amount,
      email,
      paymentProof: req.file.filename,
      status: "pending",
      method: "manual_upload",
    });

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
      fileUrl: `/uploads/${req.file.filename}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Payment submission failed", error: err.message });
  }
};

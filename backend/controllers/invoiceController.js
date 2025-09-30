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

    const invoice = await Invoice.create({
      invoiceNumber,
      customerName,
      email,
      amount,
      roomNo,
    });

   
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
          subject: `Invoice ${invoiceNumber} Created`,
          html: `
            <h2>Invoice Created</h2>
            <p>Dear ${customerName},</p>
            <p>Your invoice has been created successfully.</p>
            <ul>
              <li>Invoice Number: ${invoiceNumber}</li>
              <li>Amount: ${formatAmount(amount)}</li>
              <li>Room No: ${roomNo ?? "N/A"}</li>
            </ul>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email}`);
      } catch (mailErr) {
        console.error("Failed to send email:", mailErr);
      }
    }

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

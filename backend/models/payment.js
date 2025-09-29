import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  method: {
    type: String,
    enum: ["cash", "credit_card", "bank_transfer", "paypal", "manual_upload"],
    required: true,
  },
  paymentProof: { type: String },
  status: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  paidAt: { type: Date },
  date: { type: Date, default: Date.now },
});

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;

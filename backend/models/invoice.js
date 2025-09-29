import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  roomNo: {
    type: Number,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },

  
  status: {
    type: String,
    default: "pending", 
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  paidAt: {
    type: Date,
  },
  email: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;

import mongoose from "mongoose";
import { transporter } from "../utils/email";

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
    },
    reminderTime: { type: Date, required: true },
    sent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

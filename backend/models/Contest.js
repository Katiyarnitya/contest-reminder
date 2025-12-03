import mongoose from "mongoose";

const contestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      required: true,
    },
    slug: {
      //unique and they help you update contest data when API changes
      type: String,
      required: true,
      unique: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      //will be automatically updated by cron job.
      type: String,
      enum: ["upcoming", "running", "finished"],
      default: "upcoming",
    },
    url: { type: String },
  },
  { timestamps: true }
);
export const Contest = mongoose.model("Contest", contestSchema);

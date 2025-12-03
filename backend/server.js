import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDb } from "./config/db.js";

import cron from "node-cron";
import { updateContestsJob } from "./jobs/contestUpdater.js";

const app = express();

// middleware
app.use(express.json()); //parse the json bodies

dotenv.config();
connectDb();

// Start cron job → run every half an  hour
cron.schedule("0,30 * * * *", updateContestsJob);

app.get("/runjob", async (req, res) => {
  await updateContestsJob();
  console.log("Job ran manually");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`listening to ${PORT}`);
});

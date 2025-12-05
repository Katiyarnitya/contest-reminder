import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cron from "node-cron";
import { connectDb } from "./config/db.js";
import { updateContestsJob } from "./jobs/contestUpdater.js";
// import { reminderSenderJob } from "./jobs/reminderSender.js";
import { Contest } from "./models/Contest.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

connectDb();

// Cron: every 30 minutes for contests, every minute for reminders (adjust as needed)
cron.schedule("0,30, * * * *", async () => {
  try {
    await updateContestsJob();
  } catch (e) {
    console.error("Scheduled contest job failed:", e.message);
  }
});

// cron.schedule("* * * * *", async () => {
//   try {
//     await reminderSenderJob();
//   } catch (e) {
//     console.error("Scheduled reminder job failed:", e.message);
//   }
// });

// GET /contests - returns organized contests grouped by platform
// Query params: platform, status, sort=asc|desc, limit
app.get("/contests", async (req, res) => {
  console.log("Job running");
  try {
    const { platform, status, sort = "asc", limit } = req.query;
    const filter = {};
    if (platform) filter.platform = platform;
    if (status) filter.status = status;

    let query = Contest.find(filter).lean();
    query = query.sort({ startTime: sort === "asc" ? 1 : -1 });
    if (limit) query = query.limit(parseInt(limit, 10));

    const contests = await query.exec();

    // Group by platform
    const grouped = contests.reduce((acc, c) => {
      const p = c.platform || "unknown";
      if (!acc[p]) acc[p] = [];
      acc[p].push({
        id: c._id,
        name: c.name,
        slug: c.slug,
        url: c.url,
        startTime: c.startTime,
        endTime: c.endTime,
        status: c.status,
      });
      return acc;
    }, {});

    return res.json({
      count: contests.length,
      platforms: Object.keys(grouped),
      contests: grouped,
    });
  } catch (err) {
    console.error("Error fetching contests:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log(`Server listening on 5000`));

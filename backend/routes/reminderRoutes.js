import { express } from "express";
import { Reminder } from "../models/Reminder.js";

const router = express.Router();
router.post("/set", async (req, res) => {
  try {
    const { userId, contestId, reminderTime } = req.body;

    const newReminder = new Reminder({
      user: userId,
      contest: contestId,
      reminderTime,
    });
    await newReminder.save();

    res.status(201).json({ message: "Reminder set successully" });
  } catch (error) {
    res.status(500).son({ error: error.message });
  }
});
export default router;

import { Reminder } from "../models/Reminder.js";
import { Contest } from "../models/Contest.js";
import { User } from "../models/Users.js";
import { sendEmail } from "../models/Reminder.js";

export const reminderSenderJob = async () => {
  console.log("checking reminders...");

  try {
    const reminders = await Reminder.find({ notified: false });

    for (const r of reminders) {
      const contest = await Contest.findById(r.contest);
      if (!contest) continue;

      const user = await User.findById(r.user);
      if (!user) continue;

      const now = new Date();

      if (now >= r.reminderTime && now < contest.startTime) {
        await sendEmail(
          user.email,
          `⏰ ${contest.name} starts soon!`,
          `
            <h2>Your Contest Reminder</h2>
            <p><b>${contest.name}</b> is about to start.</p>
            <p><b>Start Time:</b> ${contest.startTime}</p>
            <a href="${contest.url}" target="_blank">Click to visit contest</a>
          `
        );
        r.sent = true;
        await r.save();
      }
    }
  } catch (error) {
    console.log("Error in reminder job:", error.message);
  }
};

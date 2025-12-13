import { Reminder } from "../models/Reminder.js";
import { Contest } from "../models/Contest.js";
import { sendEmail } from "../services/GmailServices.js";
// import { User } from "../models/User.js";

// placeholder notification sender — replace with email/Push/Telegram
const sendNotification = async (user, contest, reminder) => {
  // Implement real delivery here
  sendEmail(
    user.email,
    ` ${contest.name} on ${contest.platform} `,
    `Join at ${contest.startTime} `
  );
  console.log(
    `Notify ${user.email}: Reminder for ${contest.name} at ${reminder.reminderTime}`
  );
  return true;
};

// export const reminderSenderJob = async () => {
//   console.log("Running reminder sender job...");
//   try {
//     const now = new Date();
//     // Find reminders due and not sent
//     const reminders = await Reminder.find({
//       reminderTime: { $lte: now },
//       sent: false,
//     })
//       .limit(200)
//       .populate("user contest");
//     if (!reminders || reminders.length === 0) {
//       console.log("No reminders to send right now.");
//       return;
//     }
//     for (const r of reminders) {
//       try {
//         const ok = await sendNotification(r.user, r.contest, r);
//         if (ok) {
//           r.sent = true;
//           await r.save();
//         }
//       } catch (err) {
//         console.warn("Failed to send reminder", r._id, err.message);
//       }
//     }
//   } catch (err) {
//     console.error("Reminder job failed:", err.message);
//   }
// };

const REMINDER_INTERVALS = [
  { time: 6 * 60, label: "6 hours" },
  { time: 2 * 60, label: "2 hours" },
  { time: 60, label: "1 hour" },
  { time: 30, label: "30 minutes" },
  { time: 15, label: "15 minutes" },
];

const createEmailTemplate = (contest, timeLeft) => ({
  subject: `🚨 Contest Alert: ${contest.name} starts in ${timeLeft}!`,
  html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c5aa0;">🏆 Contest Reminder</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #dc3545; margin-top: 0;">⏰ Starting in ${timeLeft}</h3>
                <h4 style="color: #343a40;">${contest.name}</h4>
                <p><strong>Start Time:</strong> ${contest.startTime.toLocaleString()}</p>
                ${
                  contest.platform
                    ? `<p><strong>Platform:</strong> ${contest.platform}</p>`
                    : ""
                }
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${contest.url}" 
                   style="background: #28a745; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 5px; font-weight: bold;">
                    🚀 Join Contest
                </a>
            </div>
            
            <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin-top: 20px;">
                <p style="margin: 0; color: #6c757d; font-size: 14px;">
                    Good luck! 🍀 May the code be with you! 💻
                </p>
            </div>
        </div>
    `,
  text: `
Contest Reminder: ${contest.name}
Starting in: ${timeLeft}
Start Time: ${contest.startTime.toLocaleString()}
${contest.platform ? `Platform: ${contest.platform}` : ""}
Contest URL: ${contest.url}

Good luck! 🍀
    `,
});

export const checkContestReminders = async () => {
  try {
    const contests = await updateContestsJob();
    const now = new Date();
    const recipientEmail = process.env.RECIPIENT_EMAIL;

    if (!recipientEmail) {
      console.warn("No recipient email configured");
      return;
    }

    for (const contest of contests) {
      const startTime = new Date(contest.startTime);
      const timeDiffMins = Math.floor(
        (startTime.getTime() - now.getTime()) / (1000 * 60)
      );

      for (const interval of REMINDER_INTERVALS) {
        const notificationKey = `${contest.name}-${contest.startTime}-${interval.time}`;

        if (Math.abs(timeDiffMins - interval.time) <= 5) {
          const emailContent = createEmailTemplate(contest, interval.label);

          const sent = await sendEmail(
            recipientEmail,
            emailContent.subject,
            emailContent.text,
            emailContent.html
          );

          if (sent) {
            console.log(
              `📧 Reminder sent for ${contest.name} - ${interval.label} before start`
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error checking contest reminders:", error);
  }
};

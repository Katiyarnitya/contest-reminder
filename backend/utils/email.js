import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "email",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.log("Email connection failed:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

export const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Contest Reminder" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.log("Error sending email :", error.message);
  }
};

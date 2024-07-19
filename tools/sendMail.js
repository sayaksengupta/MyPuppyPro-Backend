const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendMail(fromEmail, toEmail, message, puppy) {
  try {
    // Log the type and content of `message`
    console.log("Type of message:", typeof message);
    console.log("Message content:", message);

    const info = await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: `Puppy Enquiry for ${puppy}`,
      html: message 
    });

    return info;
  } catch (err) {
    console.error("Error sending mail:", err);
    return false;
  }
}

module.exports = { transporter, sendMail };

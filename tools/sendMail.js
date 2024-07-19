const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendMail(from, to, puppy, body) {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: `Puppy Enquiry for ${puppy}`,
      body,
    });

    return info;
  } catch (err) {
    console.error(err);
    return false;
  }
}

module.exports = { transporter, sendMail };

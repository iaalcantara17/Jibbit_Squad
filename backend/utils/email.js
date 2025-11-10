import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "contact.jibbit@gmail.com",
    pass: "nrscudlaqyrpnojm"
  },
});

export const sendEmail = async ({ to, subject, html, text }) => {
  const info = await transporter.sendMail({
    from: "Jibbit Support <contact.jibbit@gmail.com>",
    to,
    subject,
    text,
    html,
  });

  console.log("📨 Email sent:", info.response);
  return info;
};


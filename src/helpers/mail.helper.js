import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.SMTP_KEY,
    },
});

export async function sendEmail({ to, subject, html }) {
    return transporter.sendMail({
        from: '"Project Manager" <itshussainmurtaza@gmail.com>',
        to,
        subject,
        html,
    });
}
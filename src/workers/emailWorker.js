// workers/emailWorker.js

const { Worker } = require("bullmq");
const { sendEmail } = require("../helpers/mail.helper");
const connection = require("../../config/redis");

const worker = new Worker(
    "email-queue",
    async (job) => {
        switch (job.name) {
            case "task-assigned":
                await sendEmail({
                    to: job.data.to,
                    subject: "Task Assigned",
                    html: `
                        <p>You have been assigned task:</p>
                        <strong>${job.data.taskName}</strong>
                    `,
                });
                break;
            case "project-invitation":
                await sendEmail({
                    to: job.data.to,
                    subject: "Project Invitation",
                    html: `You are invited to a project ${job.data.projectName} <br/><a href="${job.data.invitationLink}">Accept Invite</a>`,
                });
                break;
            default:
                console.log(`Unknown job ${job.name}`);
                break;
        }
    },
    {
        connection
    }
);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.log(`Job ${job.id} failed`, err);
});

console.log("Email worker started...");
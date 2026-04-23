const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { testConnection } = require("./config/db");
const authRouter = require("./src/routes/auth.router");
const adminUserRouter = require("./src/routes/admin/user.router");
const rateLimiter = require("./src/middlewares/rateLimiter.middleware");
const userRouter = require("./src/routes/user.router");
const projectRouter = require("./src/routes/project.router");
const projectMemberRouter = require("./src/routes/project.member.router");
const taskRouter = require("./src/routes/task.router");
const taskAssigneeRouter = require("./src/routes/task.assignee.router");
const port = process.env.PORT || 8080;
const app = express();

dotenv.config();

app.use(cors());
app.use(express.json());
// 🔥 ADD THIS LINE
app.set("trust proxy", 1);
app.use(rateLimiter);

app.use("/admin/user", adminUserRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/project", projectRouter);
app.use("/api/project/member", projectMemberRouter);
app.use("/api/task", taskRouter);
app.use("/api/task/assignee", taskAssigneeRouter);

// start server AFTER DB check
async function startServer() {
  await testConnection();

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();

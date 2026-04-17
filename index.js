const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { testConnection } = require("./config/db");
const authRouter = require("./src/routes/auth.router");
const adminUserRouter = require("./src/routes/admin/user.router");
const rateLimiter = require("./src/middlewares/rateLimiter.middleware");
const userRouter = require("./src/routes/user.router");
const port = process.env.PORT || 8080;
const app = express();

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(rateLimiter);

app.use("/admin/user", adminUserRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// start server AFTER DB check
async function startServer() {
  await testConnection();

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();

const { Router } = require("express");
const { getAllUsers, deleteUser, getUserStats } = require("../../controllers/admin/user.controller");

const userRouter = Router();

userRouter.get("/", getAllUsers);
userRouter.delete("/delete/:userId", deleteUser);
userRouter.get("/stats", getUserStats);

module.exports = userRouter;
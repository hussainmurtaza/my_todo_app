const { Router } = require("express");
const { deleteUser } = require("../controllers/user.controller");
const authenticateUser = require("../middlewares/auth.middleware");

const userRouter = Router();

userRouter.delete("/delete", authenticateUser, deleteUser);

module.exports = userRouter;
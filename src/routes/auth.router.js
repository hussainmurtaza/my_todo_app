const { Router } = require("express");
const { createUser, loginUser } = require("../controllers/user.controller");

const authRouter = Router();

authRouter.post("/register", createUser);
authRouter.post("/login", loginUser);
module.exports = authRouter;

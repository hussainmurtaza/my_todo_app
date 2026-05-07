const { Router } = require("express");
const { deleteUser, autocompleteUsers } = require("../controllers/user.controller");
const authenticateUser = require("../middlewares/auth.middleware");

const userRouter = Router();

userRouter.delete("/delete", authenticateUser, deleteUser);
userRouter.get("/autocomplete", authenticateUser, autocompleteUsers);

module.exports = userRouter;
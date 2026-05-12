const { Router } = require("express");
const { refreshToken } = require("../controllers/refreshToken.controller");

const refreshTokenRouter = Router();

refreshTokenRouter.post("/", refreshToken);

module.exports = refreshTokenRouter;
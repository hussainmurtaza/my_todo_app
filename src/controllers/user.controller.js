const bcrypt = require("bcryptjs");
const UserRepository = require("../repositories/user.repository");
const ApiResponse = require("../helpers/response.helper");
const UserSessionsRepository = require("../repositories/user.sessions.repository");
const TokenService = require("../services/token.service");

const createUser = async (req, res) => {
  try {
    if (
      !req.body.first_name ||
      !req.body.last_name ||
      !req.body.email ||
      !req.body.password
    ) {
      return ApiResponse.validationError(res, "Missing required fields");
    }
    const { first_name, last_name, email, password } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const userId = await UserRepository.createUser(
      first_name,
      last_name,
      email,
      password_hash,
    );
    if (!userId) {
      return ApiResponse.error(res, "Failed to create user");
    }
    return ApiResponse.success(res, "User created successfully", userId);
  } catch (error) {
    return ApiResponse.error(res, "Internal server error", 500, error.message);
  }
};
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return ApiResponse.validationError(res, "Missing required fields");
    }
    const user = await UserRepository.getUserByEmail(email);
    if (!user) {
      return ApiResponse.error(res, "User not found");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return ApiResponse.error(res, "Invalid password");
    }
    // Create session
    const session =
      await UserSessionsRepository.createSession(
        user.id,
        req.ip,
        req.headers["user-agent"]
      );
    // Access token
    const accessToken =
      TokenService.generateAccessToken({
        userId: user.id,
        sessionId: session.sessionId,
      });
    // Secure refresh cookie
    res.cookie(
      "refreshToken",
      session.refreshToken,
      {
        httpOnly: true,
        secure:
          process.env.ENV ===
          "production",
        sameSite: "strict",
        maxAge:
          30 *
          24 *
          60 *
          60 *
          1000,
      }
    );
    return ApiResponse.success(
      res,
      "Login successful",
      {
        user,
        accessToken,
        refreshToken:
          session.refreshToken,
        sessionId:
          session.sessionId,
      }
    );
  } catch (error) {
    return ApiResponse.error(res, "Internal server error", 500, error.message);
  }
};
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.user;
    if (!userId) {
      return ApiResponse.validationError(res, "User ID is required");
    }
    const result = await UserRepository.deleteUser(userId);
    if (result.affectedRows === 0) {
      return ApiResponse.error(res, "User not found");
    }
    return ApiResponse.success(res, "User deleted successfully", result);
  } catch (error) {
    return ApiResponse.error(res, "Internal server error", 500, error.message);
  }
};
const autocompleteUsers = async (req, res) => {
  try {
    const { search = "", limit = 20 } = req.query;
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));

    const trimmedSearch = String(search).trim();
    if (trimmedSearch && trimmedSearch.length < 2) {
      return ApiResponse.validationError(
        res,
        "Search must be at least 2 characters",
      );
    }

    const result = await UserRepository.autocompleteUsers({
      query: trimmedSearch,
      limit: safeLimit,
    });

    return ApiResponse.success(res, "Users fetched successfully", result);
  } catch (error) {
    return ApiResponse.error(res, "Internal server error", 500, error.message);
  }
};
const logoutUser = async (
  req,
  res
) => {
  try {
    const { sessionId } = req.user;
    if (!sessionId) {
      return ApiResponse.validationError(res, "Session ID is required");
    }
    await UserSessionsRepository.revokeSession(
      sessionId
    );
    res.clearCookie("refreshToken");
    return ApiResponse.success(
      res,
      "Logged out successfully"
    );
  } catch (error) {
    return ApiResponse.error(
      res,
      "Internal server error"
    );
  }
};
const logoutAllDevices = async (
  req,
  res
) => {
  try {
    const { userId } = req.user;
    if (!userId) {
      return ApiResponse.validationError(res, "User ID is required");
    }
    await UserSessionsRepository.revokeAllUserSessions(
      userId
    );
    res.clearCookie("refreshToken");
    return ApiResponse.success(
      res,
      "Logged out from all devices"
    );
  } catch (error) {
    return ApiResponse.error(
      res,
      "Internal server error"
    );
  }
};

module.exports = { createUser, loginUser, deleteUser, autocompleteUsers, logoutUser, logoutAllDevices };

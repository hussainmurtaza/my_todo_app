const bcrypt = require("bcryptjs");
const UserRepository = require("../repositories/user.repository");
const ApiResponse = require("../helpers/response.helper");
const jwt = require("jsonwebtoken");

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
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return ApiResponse.success(res, "Login successfully", { user, token });
  } catch (error) {
    return ApiResponse.error(res, "Internal server error", 500, error.message);
  }
};
const deleteUser = async (req, res) => {
  try {
    const userId = req.user.userId;
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

module.exports = { createUser, loginUser, deleteUser };

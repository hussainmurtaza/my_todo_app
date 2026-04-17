const UserRepository = require("../../repositories/user.repository");
const ApiResponse = require("../../helpers/response.helper");

const getAllUsers = async (req, res) => {
  try {
    const { status = "active", search = "", page = 1, limit = 50 } = req.query;
    const users = await UserRepository.getAllUsers({
      status,
      search,
      page,
      limit,
    });
    return ApiResponse.success(res, "Users fetched successfully", {
      users: users.data,
      totalCount: users.totalCount,
    });
  } catch (error) {
    return ApiResponse.error(res, "Internal server error", 500, error.message);
  }
};
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
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
const getUserStats = async (req, res) => {
  try {
    const stats = await UserRepository.getUserStats();
    return ApiResponse.success(res, "User stats fetched successfully", stats);
  } catch (error) {
    return ApiResponse.error(res, "Internal server error", 500, error.message);
  }
};
module.exports = { getAllUsers, deleteUser, getUserStats };

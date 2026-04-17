//check if the user is authenticated
const jwt = require("jsonwebtoken");
const ApiResponse = require("../helpers/response.helper");

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return ApiResponse.error(res, "Unauthorized");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return ApiResponse.error(res, "Unauthorized", 401, error.message);
  }
};

module.exports = authenticateUser;

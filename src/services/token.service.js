const jwt = require("jsonwebtoken");
require("dotenv").config();

class TokenService {
    static generateAccessToken(payload) {
        return jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: "15m",
            }
        );
    }

    static verifyAccessToken(token) {
        return jwt.verify(
            token,
            process.env.JWT_SECRET
        );
    }
}
module.exports = TokenService;
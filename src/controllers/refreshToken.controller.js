const TokenService = require("../services/token.service");
const UserSessionsRepository = require("../repositories/user.sessions.repository");
const ApiResponse = require("../helpers/response.helper");

const refreshToken = async (req, res) => {
    try {
        // WEB → cookie
        // MOBILE → body
        const refreshToken =
            req.cookies?.refreshToken ||
            req.body?.refreshToken;

        if (!refreshToken) {
            return ApiResponse.validationError(
                res,
                "Refresh token required"
            );
        }

        const session =
            await UserSessionsRepository.findSessionByRefreshToken(
                refreshToken
            );
        if (!session) {
            return ApiResponse.unauthorized(
                res,
                "Invalid refresh token"
            );
        }

        const rotatedTokens =
            await UserSessionsRepository.rotateRefreshToken(
                session.session_id
            );

        const accessToken =
            TokenService.generateAccessToken({
                userId: session.user_id,
                sessionId:
                    session.session_id,
            });

        // WEB only → reset cookie
        if (req.cookies?.refreshToken) {
            res.cookie(
                "refreshToken",
                rotatedTokens.refreshToken,
                {
                    httpOnly: true,
                    secure:
                        process.env.NODE_ENV ===
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
        }

        return ApiResponse.success(
            res,
            "Token refreshed",
            {
                accessToken,
                // MOBILE needs new refresh token
                ...(req.body?.refreshToken && {
                    refreshToken:
                        rotatedTokens.refreshToken,
                }),
            }
        );
    } catch (error) {
        return ApiResponse.error(
            res,
            "Internal server error",
            500,
            error.message
        );
    }
};
module.exports = { refreshToken };
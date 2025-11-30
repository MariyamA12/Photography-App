// src/controllers/photographerController.js
const {
  loginUser,
  rotateRefreshToken,
  revokeRefreshToken,
} = require("../services/userService");
const pool = require("../config/db");

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax",
  path: "/api/photographer",
};

exports.photographerLogin = async (req, res) => {
  try {
    const { accessToken, refreshToken, user } = await loginUser(req.body);

    res
      .cookie("token", accessToken, {
        ...COOKIE_OPTS,
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
      })
      .cookie("refreshToken", refreshToken, {
        ...COOKIE_OPTS,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .json({
        message: "Photographer login successful",
        user,
        accessToken,
        refreshToken,
      });
  } catch (err) {
    console.error("Photographer login error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.getPhotographerProfile = async (req, res) => {
  try {
    // Get user details from database
    const { rows } = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [req.user.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];

    res.status(200).json({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: "Photographer profile retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching photographer profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.photographerRefresh = async (req, res) => {
  try {
    const oldRefresh = req.cookies.refreshToken || req.body.refreshToken;
    const { accessToken, refreshToken, user } =
      await rotateRefreshToken(oldRefresh);

    res
      .cookie("token", accessToken, {
        ...COOKIE_OPTS,
        maxAge: 2 * 60 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...COOKIE_OPTS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({ accessToken, refreshToken, user });
  } catch (err) {
    console.error("Photographer refresh error:", err);
    res.status(err.status || 401).json({ error: err.message });
  }
};

exports.photographerLogout = async (req, res) => {
  try {
    const oldRefresh = req.cookies.refreshToken || req.body.refreshToken;
    await revokeRefreshToken(oldRefresh);

    // Clear cookies
    res
      .clearCookie("token", { path: "/api/photographer" })
      .clearCookie("refreshToken", { path: "/api/photographer" })
      .status(200)
      .json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Photographer logout error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

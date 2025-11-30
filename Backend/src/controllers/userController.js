// src/controllers/userController.js
const {
  loginUser,
  rotateRefreshToken,
  revokeRefreshToken,
  createUser,
  getUsers,
  updateUser,
  deleteUser,
} = require("../services/userService");
const pool = require("../config/db");

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax",
  path: "/",
};

// POST /api/login
exports.login = async (req, res) => {
  try {
    const { accessToken, refreshToken, user } = await loginUser(req.body);
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
      .json({ message: "Login successful", user, accessToken, refreshToken });
  } catch (err) {
    console.error("Login error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// POST /api/refresh
exports.refresh = async (req, res) => {
  const oldToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!oldToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }
  try {
    const { accessToken, refreshToken, user } =
      await rotateRefreshToken(oldToken);
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
      .json({ message: "Token refreshed", user, accessToken, refreshToken });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// POST /api/logout
exports.logout = async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  try {
    if (token) await revokeRefreshToken(token);
    res
      .clearCookie("token", COOKIE_OPTS)
      .clearCookie("refreshToken", COOKIE_OPTS)
      .status(200)
      .json({ message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/profile
exports.getProfile = async (req, res) => {
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
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/admin/users
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const newUser = await createUser({ name, email, password, role });
    res.status(201).json({ user: newUser });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { search, role, sort, page, limit } = req.query;
    const result = await getUsers({ search, role, sort, page, limit });
    res.status(200).json(result);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const updated = await updateUser(req.params.id, req.body);
    res.status(200).json({ user: updated });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

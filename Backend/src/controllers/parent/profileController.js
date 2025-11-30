// src/controllers/parent/profileController.js
const pool = require('../../config/db');
const bcrypt = require('bcrypt');

// GET /api/parent/profile
exports.getParentProfile = async (req, res) => {
  try {
    const parentId = req.user.userId;

    // Get parent information
    const { rows: parentRows } = await pool.query(
      `SELECT id, name, email, created_at
       FROM users WHERE id = $1 AND role = 'parent'`,
      [parentId]
    );

    if (parentRows.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const parent = parentRows[0];

    // Get children information
    const { rows: childrenRows } = await pool.query(
      `SELECT 
         s.id,
         s.name,
         s.class_name,
         sch.name as school_name,
         ps.relationship_type
       FROM students s
       JOIN parent_student ps ON s.id = ps.student_id
       LEFT JOIN schools sch ON s.school_id = sch.id
       WHERE ps.parent_id = $1
       ORDER BY s.name`,
      [parentId]
    );

    res.status(200).json({
      parent: {
        id: parent.id,
        name: parent.name,
        email: parent.email,
        created_at: parent.created_at
      },
      children: childrenRows.map(child => ({
        id: child.id,
        name: child.name,
        class_name: child.class_name,
        school_name: child.school_name || 'Unknown School',
        relationship_type: child.relationship_type
      }))
    });
  } catch (err) {
    console.error('Get parent profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/parent/profile
exports.updateParentProfile = async (req, res) => {
  try {
    const parentId = req.user.userId;
    const { name, email } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if email is already in use by another user
    const { rows: existing } = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND id <> $2`,
      [email, parentId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Update parent profile
    const { rows: updatedRows } = await pool.query(
      `UPDATE users 
       SET name = $1, email = $2
       WHERE id = $3 AND role = 'parent'
       RETURNING id, name, email, created_at`,
      [name, email, parentId]
    );

    if (updatedRows.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      parent: updatedRows[0]
    });
  } catch (err) {
    console.error('Update parent profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/parent/change-password
exports.changeParentPassword = async (req, res) => {
  try {
    const parentId = req.user.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    console.log('Password change request:', { parentId, hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword, hasConfirmPassword: !!confirmPassword });

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'All password fields are required' });
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      console.log('Passwords do not match');
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      console.log('Password too short');
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Get current password hash
    const { rows: userRows } = await pool.query(
      `SELECT password_hash FROM users WHERE id = $1 AND role = 'parent'`,
      [parentId]
    );

    if (userRows.length === 0) {
      console.log('Parent not found:', parentId);
      return res.status(404).json({ error: 'Parent not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userRows[0].password_hash);
    console.log('Current password valid:', isCurrentPasswordValid);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [newPasswordHash, parentId]
    );

    console.log('Password updated successfully for parent:', parentId);
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change parent password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 
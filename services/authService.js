const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      profileId: user.studentId || user.staffId || null,
    },
    process.env.JWT_SECRET || 'dev-jwt-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
};

module.exports = { generateToken };

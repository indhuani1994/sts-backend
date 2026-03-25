const { getHRUsers } = require('../models/hrModel');

const loginHR = (req, res) => {
  const { username, password } = req.body;
  const users = getHRUsers();

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (user) {
    return res.json({ success: true, role: "hr" });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
};

module.exports = { loginHR };

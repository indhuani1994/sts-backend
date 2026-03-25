const fs = require('fs');
const path = require('path');

const getHRUsers = () => {
  const filePath = path.join(__dirname, '../data/hr-users.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
};

module.exports = { getHRUsers };

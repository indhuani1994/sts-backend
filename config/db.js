const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri,  {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  family: 4 // forces IPv4 instead of IPv6
});
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.log(err)
    process.exit(1);
  }
};

module.exports = connectDB;

const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const User = require('./models/user');
const { notFound, errorHandler } = require('./middleware/errorHandler');

connectDB();

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors());
app.use(limiter);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Backend is healthy' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/staffs', require('./routes/staffRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/placements', require('./routes/placementRoutes'));
app.use('/api/company', require('./routes/companyRoutes'));
app.use('/api/stureg', require('./routes/studentRegRoutes'));
app.use('/api/receipt', require('./routes/sendReceiptRoutes'));
app.use('/api/stuins', require('./routes/studentInstallRoutes'));
app.use('/api/enquiry', require('./routes/enquiryRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/schedule', require('./routes/courseUpdateRoutes'));
app.use('/api/events', require('./routes/events'));
app.use('/api/festival', require('./routes/festival'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api', require('./routes/studentmark'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/review', require('./routes/reviewRoutes'));
app.use('/api/recruit', require('./routes/recruitRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.use(notFound);
app.use(errorHandler);

const seedDefaultAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return;
    }

    const username = process.env.DEFAULT_ADMIN_USERNAME;
    const password = process.env.DEFAULT_ADMIN_PASSWORD;

    if (!username || !password) {
      console.warn('Default admin credentials are not configured in .env');
      return;
    }

    await User.create({ username, password, role: 'admin' });
    console.log('Default admin user created from environment variables');
  } catch (err) {
    console.error('Error creating default admin user:', err.message);
  }
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await seedDefaultAdminUser();
  console.log(`Server running on port ${PORT}`);
});

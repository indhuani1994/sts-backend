// const path = require('path');
// const multer = require('multer');

// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => {
//     cb(null, 'uploads');
//   },
//   filename: (_req, file, cb) => {
//     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//     cb(null, `${uniqueName}${path.extname(file.originalname)}`);
//   },
// });

// const fileFilter = (_req, file, cb) => {
//   const fileTypes = /jpeg|jpg|png|gif|pdf|webp/;
//   const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimeType = fileTypes.test(file.mimetype);

//   if (extname && mimeType) {
//     cb(null, true);
//     return;
//   }

//   cb(new Error('Only image or PDF files are allowed'));
// };

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 10 * 1024 * 1024 },
// });

// module.exports = upload;

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Configure Cloudinary (Get these from your Cloudinary Dashboard)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Setup Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const isRaw =
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    let folderName = 'others';

    if (req.baseUrl.includes('student')) {
      folderName = 'student';
    } else if (req.baseUrl.includes('staff')) {
      folderName = 'staff';
    } else if (req.baseUrl.includes('course')) {
      folderName = 'course';
    } else if (req.baseUrl.includes('event')) {
      folderName = 'event';
    } else if (req.baseUrl.includes('company')) {
      folderName = 'company';
    }

    return {
      folder: `sts_management/${folderName}`,
      resource_type: isRaw ? 'raw' : 'image',
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  } // ✅ close params function
}); // ✅ close CloudinaryStorage

// 3. Keep your existing fileFilter if you want extra validation
const fileFilter = (_req, file, cb) => {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only image, PDF, DOC, or DOCX files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } 
});

module.exports = upload;

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// File filter: only allow image types
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم. يرجى رفع صور بصيغة JPEG, PNG, أو WebP فقط'), false);
  }
};

// Car images storage
const carStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads/cars'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const random = crypto.randomBytes(8).toString('hex');
    cb(null, `car-${Date.now()}-${random}${ext}`);
  }
});

// Brand logo storage
const brandStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads/brands'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const random = crypto.randomBytes(8).toString('hex');
    cb(null, `brand-${Date.now()}-${random}${ext}`);
  }
});

// Hero image storage
const heroStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads/hero'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const random = crypto.randomBytes(8).toString('hex');
    cb(null, `hero-${Date.now()}-${random}${ext}`);
  }
});

const uploadCarImages = multer({
  storage: carStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).array('images', 10);

const uploadBrandLogo = multer({
  storage: brandStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('logo');

const uploadHeroImage = multer({
  storage: heroStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('bg_image');

module.exports = { uploadCarImages, uploadBrandLogo, uploadHeroImage };

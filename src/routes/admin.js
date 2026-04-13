const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const slugify = require('slugify');

const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { uploadCarImages, uploadBrandLogo, uploadHeroImage } = require('../middleware/upload');

const Car = require('../models/Car');
const CarImage = require('../models/CarImage');
const CarFeature = require('../models/CarFeature');
const Brand = require('../models/Brand');
const User = require('../models/User');
const PurchaseRequest = require('../models/PurchaseRequest');
const ContactMessage = require('../models/ContactMessage');
const HeroSlide = require('../models/HeroSlide');
const Testimonial = require('../models/Testimonial');
const Branch = require('../models/Branch');
const SiteSetting = require('../models/SiteSetting');

// ============================================================
// AUTH ROUTES (no isAuthenticated middleware)
// ============================================================

// GET /admin/login
router.get('/login', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/admin');
  }
  res.render('admin/login', {
    title: 'تسجيل الدخول | الكيف للسيارات',
    layout: false
  });
});

// POST /admin/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      req.flash('error', 'يرجى إدخال اسم المستخدم وكلمة المرور');
      return res.redirect('/admin/login');
    }

    const user = User.findByUsername(username);
    if (!user) {
      req.flash('error', 'اسم المستخدم أو كلمة المرور غير صحيحة');
      return res.redirect('/admin/login');
    }

    if (!user.is_active) {
      req.flash('error', 'الحساب معطل. يرجى التواصل مع المسؤول');
      return res.redirect('/admin/login');
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      req.flash('error', 'اسم المستخدم أو كلمة المرور غير صحيحة');
      return res.redirect('/admin/login');
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.userRole = user.role;

    return res.redirect('/admin');
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'حدث خطأ أثناء تسجيل الدخول');
    return res.redirect('/admin/login');
  }
});

// POST /admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/admin/login');
  });
});

// ============================================================
// ALL ROUTES BELOW REQUIRE AUTHENTICATION
// ============================================================
router.use(isAuthenticated);

// ============================================================
// DASHBOARD
// ============================================================
router.get('/', (req, res) => {
  try {
    const carCount = Car.count();
    const brandCount = Brand.count();
    const newPurchaseRequests = PurchaseRequest.countNew();
    const unreadMessages = ContactMessage.countUnread();
    const userCount = User.count();

    const { requests: recentRequests } = PurchaseRequest.list({ limit: 5 });
    const { messages: recentMessages } = ContactMessage.list({ limit: 5 });

    res.render('admin/dashboard', {
      title: 'لوحة التحكم | الكيف للسيارات',
      carCount,
      brandCount,
      newPurchaseRequests,
      unreadMessages,
      userCount,
      recentRequests,
      recentMessages
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل لوحة التحكم');
    res.render('admin/dashboard', {
      title: 'لوحة التحكم | الكيف للسيارات',
      carCount: 0, brandCount: 0, newPurchaseRequests: 0,
      unreadMessages: 0, userCount: 0,
      recentRequests: [], recentMessages: []
    });
  }
});

// ============================================================
// CARS CRUD
// ============================================================
router.get('/cars', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const { cars, total, pages } = Car.list({ page, limit: 20 });

    res.render('admin/cars/index', {
      title: 'إدارة السيارات | الكيف للسيارات',
      cars, total, pages, currentPage: page
    });
  } catch (error) {
    console.error('Admin cars list error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل قائمة السيارات');
    res.redirect('/admin');
  }
});

router.get('/cars/create', (req, res) => {
  try {
    const brands = Brand.list(false);

    res.render('admin/cars/form', {
      title: 'إضافة سيارة | الكيف للسيارات',
      car: null,
      brands
    });
  } catch (error) {
    console.error('Admin car create form error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل النموذج');
    res.redirect('/admin/cars');
  }
});

router.post('/cars/create', (req, res) => {
  uploadCarImages(req, res, (err) => {
    if (err) {
      console.error('Car image upload error:', err);
      req.flash('error', err.message || 'حدث خطأ أثناء رفع الصور');
      return res.redirect('/admin/cars/create');
    }

    try {
      const {
        brand_id, name_en, name_ar, year, price, price_on_request,
        condition, body_type, fuel_type, transmission, drivetrain,
        color_ar, color_en, mileage, engine_size, horsepower,
        seats_material, fuel_consumption, description_ar, description_en,
        is_featured, is_active, sort_order, features
      } = req.body;

      // Generate slug
      const slug = slugify(name_en || name_ar, { lower: true, strict: true });

      const carId = Car.create({
        brand_id: parseInt(brand_id),
        name_en, name_ar, slug,
        year: year ? parseInt(year) : null,
        price: price ? parseFloat(price) : null,
        price_on_request: price_on_request ? 1 : 0,
        condition: condition || 'new',
        body_type, fuel_type, transmission, drivetrain,
        color_ar, color_en,
        mileage: mileage ? parseInt(mileage) : null,
        engine_size,
        horsepower: horsepower ? parseInt(horsepower) : null,
        seats_material, fuel_consumption,
        description_ar, description_en,
        is_featured: is_featured ? 1 : 0,
        is_active: is_active !== undefined ? 1 : 0,
        sort_order: sort_order ? parseInt(sort_order) : 0
      });

      // Handle features (comma or newline separated)
      if (features && features.trim()) {
        const featureList = features
          .split(/[\n,]+/)
          .map(f => f.trim())
          .filter(f => f.length > 0);
        if (featureList.length > 0) {
          CarFeature.bulkCreate(carId, featureList);
        }
      }

      // Handle uploaded images
      if (req.files && req.files.length > 0) {
        req.files.forEach((file, index) => {
          CarImage.create({
            car_id: carId,
            image_path: '/uploads/cars/' + file.filename,
            alt_text: name_ar || name_en,
            sort_order: index,
            is_primary: index === 0 ? 1 : 0
          });
        });
      }

      req.flash('success', 'تم إضافة السيارة بنجاح');
      res.redirect('/admin/cars');
    } catch (error) {
      console.error('Admin car create error:', error);
      req.flash('error', 'حدث خطأ أثناء إضافة السيارة');
      res.redirect('/admin/cars/create');
    }
  });
});

router.get('/cars/:id/edit', (req, res) => {
  try {
    const car = Car.findById(req.params.id);
    if (!car) {
      req.flash('error', 'السيارة غير موجودة');
      return res.redirect('/admin/cars');
    }

    car.images = CarImage.listByCar(car.id);
    car.features = CarFeature.listByCar(car.id);

    const brands = Brand.list(false);

    res.render('admin/cars/form', {
      title: 'تعديل السيارة | الكيف للسيارات',
      car,
      brands
    });
  } catch (error) {
    console.error('Admin car edit form error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل النموذج');
    res.redirect('/admin/cars');
  }
});

router.post('/cars/:id/edit', (req, res) => {
  const carId = req.params.id;

  uploadCarImages(req, res, (err) => {
    if (err) {
      console.error('Car image upload error:', err);
      req.flash('error', err.message || 'حدث خطأ أثناء رفع الصور');
      return res.redirect(`/admin/cars/${carId}/edit`);
    }

    try {
      const {
        brand_id, name_en, name_ar, year, price, price_on_request,
        condition, body_type, fuel_type, transmission, drivetrain,
        color_ar, color_en, mileage, engine_size, horsepower,
        seats_material, fuel_consumption, description_ar, description_en,
        is_featured, is_active, sort_order, features
      } = req.body;

      const slug = slugify(name_en || name_ar, { lower: true, strict: true });

      Car.update(carId, {
        brand_id: parseInt(brand_id),
        name_en, name_ar, slug,
        year: year ? parseInt(year) : null,
        price: price ? parseFloat(price) : null,
        price_on_request: price_on_request ? 1 : 0,
        condition: condition || 'new',
        body_type, fuel_type, transmission, drivetrain,
        color_ar, color_en,
        mileage: mileage ? parseInt(mileage) : null,
        engine_size,
        horsepower: horsepower ? parseInt(horsepower) : null,
        seats_material, fuel_consumption,
        description_ar, description_en,
        is_featured: is_featured ? 1 : 0,
        is_active: is_active !== undefined ? 1 : 0,
        sort_order: sort_order ? parseInt(sort_order) : 0
      });

      // Rebuild features
      if (features !== undefined) {
        CarFeature.deleteAllByCar(carId);
        if (features && features.trim()) {
          const featureList = features
            .split(/[\n,]+/)
            .map(f => f.trim())
            .filter(f => f.length > 0);
          if (featureList.length > 0) {
            CarFeature.bulkCreate(carId, featureList);
          }
        }
      }

      // Add new uploaded images
      if (req.files && req.files.length > 0) {
        const existingImages = CarImage.listByCar(carId);
        const startOrder = existingImages.length;

        req.files.forEach((file, index) => {
          CarImage.create({
            car_id: carId,
            image_path: '/uploads/cars/' + file.filename,
            alt_text: name_ar || name_en,
            sort_order: startOrder + index,
            is_primary: existingImages.length === 0 && index === 0 ? 1 : 0
          });
        });
      }

      req.flash('success', 'تم تحديث السيارة بنجاح');
      res.redirect('/admin/cars');
    } catch (error) {
      console.error('Admin car update error:', error);
      req.flash('error', 'حدث خطأ أثناء تحديث السيارة');
      res.redirect(`/admin/cars/${carId}/edit`);
    }
  });
});

router.post('/cars/:id/delete', (req, res) => {
  try {
    Car.delete(req.params.id);
    req.flash('success', 'تم حذف السيارة بنجاح');
  } catch (error) {
    console.error('Admin car delete error:', error);
    req.flash('error', 'حدث خطأ أثناء حذف السيارة');
  }
  res.redirect('/admin/cars');
});

router.post('/cars/:id/images/:imgId/delete', (req, res) => {
  try {
    CarImage.delete(req.params.imgId);
    req.flash('success', 'تم حذف الصورة بنجاح');
  } catch (error) {
    console.error('Admin car image delete error:', error);
    req.flash('error', 'حدث خطأ أثناء حذف الصورة');
  }
  res.redirect('back');
});

router.post('/cars/:id/images/:imgId/primary', (req, res) => {
  try {
    CarImage.setPrimary(req.params.imgId, req.params.id);
    req.flash('success', 'تم تعيين الصورة الرئيسية بنجاح');
  } catch (error) {
    console.error('Admin car image set primary error:', error);
    req.flash('error', 'حدث خطأ أثناء تعيين الصورة الرئيسية');
  }
  res.redirect('back');
});

// ============================================================
// BRANDS CRUD
// ============================================================
router.get('/brands', (req, res) => {
  try {
    const brands = Brand.listWithCarCount();

    res.render('admin/brands/index', {
      title: 'إدارة الماركات | الكيف للسيارات',
      brands
    });
  } catch (error) {
    console.error('Admin brands list error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل قائمة الماركات');
    res.redirect('/admin');
  }
});

router.get('/brands/create', (req, res) => {
  res.render('admin/brands/form', {
    title: 'إضافة ماركة | الكيف للسيارات',
    brand: null
  });
});

router.post('/brands/create', (req, res) => {
  uploadBrandLogo(req, res, (err) => {
    if (err) {
      console.error('Brand logo upload error:', err);
      req.flash('error', err.message || 'حدث خطأ أثناء رفع الشعار');
      return res.redirect('/admin/brands/create');
    }

    try {
      const { name_ar, name_en, sort_order } = req.body;
      const slug = slugify(name_en || name_ar, { lower: true, strict: true });
      const logo_path = req.file ? '/uploads/brands/' + req.file.filename : null;

      Brand.create({
        name_ar, name_en, slug, logo_path,
        sort_order: sort_order ? parseInt(sort_order) : 0
      });

      req.flash('success', 'تم إضافة الماركة بنجاح');
      res.redirect('/admin/brands');
    } catch (error) {
      console.error('Admin brand create error:', error);
      req.flash('error', 'حدث خطأ أثناء إضافة الماركة');
      res.redirect('/admin/brands/create');
    }
  });
});

router.get('/brands/:id/edit', (req, res) => {
  try {
    const brand = Brand.findById(req.params.id);
    if (!brand) {
      req.flash('error', 'الماركة غير موجودة');
      return res.redirect('/admin/brands');
    }

    res.render('admin/brands/form', {
      title: 'تعديل الماركة | الكيف للسيارات',
      brand
    });
  } catch (error) {
    console.error('Admin brand edit form error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل النموذج');
    res.redirect('/admin/brands');
  }
});

router.post('/brands/:id/edit', (req, res) => {
  const brandId = req.params.id;

  uploadBrandLogo(req, res, (err) => {
    if (err) {
      console.error('Brand logo upload error:', err);
      req.flash('error', err.message || 'حدث خطأ أثناء رفع الشعار');
      return res.redirect(`/admin/brands/${brandId}/edit`);
    }

    try {
      const { name_ar, name_en, sort_order, is_active } = req.body;
      const slug = slugify(name_en || name_ar, { lower: true, strict: true });

      const updateData = {
        name_ar, name_en, slug,
        sort_order: sort_order ? parseInt(sort_order) : 0,
        is_active: is_active !== undefined ? 1 : 0
      };

      if (req.file) {
        updateData.logo_path = '/uploads/brands/' + req.file.filename;
      }

      Brand.update(brandId, updateData);

      req.flash('success', 'تم تحديث الماركة بنجاح');
      res.redirect('/admin/brands');
    } catch (error) {
      console.error('Admin brand update error:', error);
      req.flash('error', 'حدث خطأ أثناء تحديث الماركة');
      res.redirect(`/admin/brands/${brandId}/edit`);
    }
  });
});

router.post('/brands/:id/delete', (req, res) => {
  try {
    Brand.delete(req.params.id);
    req.flash('success', 'تم حذف الماركة بنجاح');
  } catch (error) {
    console.error('Admin brand delete error:', error);
    req.flash('error', 'حدث خطأ أثناء حذف الماركة');
  }
  res.redirect('/admin/brands');
});

// ============================================================
// PURCHASE REQUESTS
// ============================================================
router.get('/purchase-requests', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const status = req.query.status || null;

    const { requests, total, pages } = PurchaseRequest.list({ page, limit: 20, status });

    res.render('admin/purchase-requests/index', {
      title: 'طلبات الشراء | الكيف للسيارات',
      requests, total, pages, currentPage: page,
      currentStatus: status
    });
  } catch (error) {
    console.error('Admin purchase requests list error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل طلبات الشراء');
    res.redirect('/admin');
  }
});

router.get('/purchase-requests/:id', (req, res) => {
  try {
    const request = PurchaseRequest.findById(req.params.id);
    if (!request) {
      req.flash('error', 'الطلب غير موجود');
      return res.redirect('/admin/purchase-requests');
    }

    res.render('admin/purchase-requests/view', {
      title: 'تفاصيل الطلب | الكيف للسيارات',
      request
    });
  } catch (error) {
    console.error('Admin purchase request view error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل تفاصيل الطلب');
    res.redirect('/admin/purchase-requests');
  }
});

router.post('/purchase-requests/:id/status', (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    PurchaseRequest.updateStatus(req.params.id, status, admin_notes);
    req.flash('success', 'تم تحديث حالة الطلب بنجاح');
  } catch (error) {
    console.error('Admin purchase request status update error:', error);
    req.flash('error', 'حدث خطأ أثناء تحديث حالة الطلب');
  }
  res.redirect('back');
});

// ============================================================
// CONTACT MESSAGES
// ============================================================
router.get('/contact-messages', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const { messages, total, pages } = ContactMessage.list({ page, limit: 20 });

    res.render('admin/contact-messages/index', {
      title: 'رسائل التواصل | الكيف للسيارات',
      messages, total, pages, currentPage: page
    });
  } catch (error) {
    console.error('Admin contact messages list error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل الرسائل');
    res.redirect('/admin');
  }
});

router.get('/contact-messages/:id', (req, res) => {
  try {
    const message = ContactMessage.findById(req.params.id);
    if (!message) {
      req.flash('error', 'الرسالة غير موجودة');
      return res.redirect('/admin/contact-messages');
    }

    // Mark as read
    ContactMessage.markAsRead(req.params.id);

    res.render('admin/contact-messages/view', {
      title: 'تفاصيل الرسالة | الكيف للسيارات',
      message
    });
  } catch (error) {
    console.error('Admin contact message view error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل الرسالة');
    res.redirect('/admin/contact-messages');
  }
});

router.post('/contact-messages/:id/delete', (req, res) => {
  try {
    ContactMessage.delete(req.params.id);
    req.flash('success', 'تم حذف الرسالة بنجاح');
  } catch (error) {
    console.error('Admin contact message delete error:', error);
    req.flash('error', 'حدث خطأ أثناء حذف الرسالة');
  }
  res.redirect('/admin/contact-messages');
});

// ============================================================
// HERO SLIDES
// ============================================================
router.get('/hero-slides', (req, res) => {
  try {
    const slides = HeroSlide.list(false);

    res.render('admin/hero-slides/index', {
      title: 'الشرائح الرئيسية | الكيف للسيارات',
      slides
    });
  } catch (error) {
    console.error('Admin hero slides list error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل الشرائح');
    res.redirect('/admin');
  }
});

router.get('/hero-slides/create', (req, res) => {
  res.render('admin/hero-slides/form', {
    title: 'إضافة شريحة | الكيف للسيارات',
    slide: null
  });
});

router.post('/hero-slides/create', (req, res) => {
  uploadHeroImage(req, res, (err) => {
    if (err) {
      console.error('Hero image upload error:', err);
      req.flash('error', err.message || 'حدث خطأ أثناء رفع الصورة');
      return res.redirect('/admin/hero-slides/create');
    }

    try {
      const data = { ...req.body };
      if (req.file) {
        data.bg_image_path = '/uploads/hero/' + req.file.filename;
      }
      data.sort_order = data.sort_order ? parseInt(data.sort_order) : 0;
      data.is_active = data.is_active ? 1 : 0;

      HeroSlide.create(data);

      req.flash('success', 'تم إضافة الشريحة بنجاح');
      res.redirect('/admin/hero-slides');
    } catch (error) {
      console.error('Admin hero slide create error:', error);
      req.flash('error', 'حدث خطأ أثناء إضافة الشريحة');
      res.redirect('/admin/hero-slides/create');
    }
  });
});

router.get('/hero-slides/:id/edit', (req, res) => {
  try {
    const slide = HeroSlide.findById(req.params.id);
    if (!slide) {
      req.flash('error', 'الشريحة غير موجودة');
      return res.redirect('/admin/hero-slides');
    }

    res.render('admin/hero-slides/form', {
      title: 'تعديل الشريحة | الكيف للسيارات',
      slide
    });
  } catch (error) {
    console.error('Admin hero slide edit form error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل النموذج');
    res.redirect('/admin/hero-slides');
  }
});

router.post('/hero-slides/:id/edit', (req, res) => {
  const slideId = req.params.id;

  uploadHeroImage(req, res, (err) => {
    if (err) {
      console.error('Hero image upload error:', err);
      req.flash('error', err.message || 'حدث خطأ أثناء رفع الصورة');
      return res.redirect(`/admin/hero-slides/${slideId}/edit`);
    }

    try {
      const data = { ...req.body };
      if (req.file) {
        data.bg_image_path = '/uploads/hero/' + req.file.filename;
      }
      data.sort_order = data.sort_order ? parseInt(data.sort_order) : 0;
      data.is_active = data.is_active ? 1 : 0;

      HeroSlide.update(slideId, data);

      req.flash('success', 'تم تحديث الشريحة بنجاح');
      res.redirect('/admin/hero-slides');
    } catch (error) {
      console.error('Admin hero slide update error:', error);
      req.flash('error', 'حدث خطأ أثناء تحديث الشريحة');
      res.redirect(`/admin/hero-slides/${slideId}/edit`);
    }
  });
});

router.post('/hero-slides/:id/delete', (req, res) => {
  try {
    HeroSlide.delete(req.params.id);
    req.flash('success', 'تم حذف الشريحة بنجاح');
  } catch (error) {
    console.error('Admin hero slide delete error:', error);
    req.flash('error', 'حدث خطأ أثناء حذف الشريحة');
  }
  res.redirect('/admin/hero-slides');
});

// ============================================================
// TESTIMONIALS
// ============================================================
router.get('/testimonials', (req, res) => {
  try {
    const testimonials = Testimonial.list(false);

    res.render('admin/testimonials/index', {
      title: 'آراء العملاء | الكيف للسيارات',
      testimonials
    });
  } catch (error) {
    console.error('Admin testimonials list error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل آراء العملاء');
    res.redirect('/admin');
  }
});

router.get('/testimonials/create', (req, res) => {
  res.render('admin/testimonials/form', {
    title: 'إضافة رأي | الكيف للسيارات',
    testimonial: null
  });
});

router.post('/testimonials/create', (req, res) => {
  try {
    const { author_name, author_role, author_initial, content, rating, is_active, sort_order } = req.body;

    Testimonial.create({
      author_name,
      author_role,
      author_initial: author_initial || (author_name ? author_name.charAt(0) : ''),
      content,
      rating: rating ? parseInt(rating) : 5,
      is_active: is_active ? 1 : 0,
      sort_order: sort_order ? parseInt(sort_order) : 0
    });

    req.flash('success', 'تم إضافة الرأي بنجاح');
    res.redirect('/admin/testimonials');
  } catch (error) {
    console.error('Admin testimonial create error:', error);
    req.flash('error', 'حدث خطأ أثناء إضافة الرأي');
    res.redirect('/admin/testimonials/create');
  }
});

router.get('/testimonials/:id/edit', (req, res) => {
  try {
    const testimonial = Testimonial.findById(req.params.id);
    if (!testimonial) {
      req.flash('error', 'الرأي غير موجود');
      return res.redirect('/admin/testimonials');
    }

    res.render('admin/testimonials/form', {
      title: 'تعديل الرأي | الكيف للسيارات',
      testimonial
    });
  } catch (error) {
    console.error('Admin testimonial edit form error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل النموذج');
    res.redirect('/admin/testimonials');
  }
});

router.post('/testimonials/:id/edit', (req, res) => {
  try {
    const { author_name, author_role, author_initial, content, rating, is_active, sort_order } = req.body;

    Testimonial.update(req.params.id, {
      author_name,
      author_role,
      author_initial: author_initial || (author_name ? author_name.charAt(0) : ''),
      content,
      rating: rating ? parseInt(rating) : 5,
      is_active: is_active ? 1 : 0,
      sort_order: sort_order ? parseInt(sort_order) : 0
    });

    req.flash('success', 'تم تحديث الرأي بنجاح');
    res.redirect('/admin/testimonials');
  } catch (error) {
    console.error('Admin testimonial update error:', error);
    req.flash('error', 'حدث خطأ أثناء تحديث الرأي');
    res.redirect(`/admin/testimonials/${req.params.id}/edit`);
  }
});

router.post('/testimonials/:id/delete', (req, res) => {
  try {
    Testimonial.delete(req.params.id);
    req.flash('success', 'تم حذف الرأي بنجاح');
  } catch (error) {
    console.error('Admin testimonial delete error:', error);
    req.flash('error', 'حدث خطأ أثناء حذف الرأي');
  }
  res.redirect('/admin/testimonials');
});

// ============================================================
// BRANCHES
// ============================================================
router.get('/branches', (req, res) => {
  try {
    const branches = Branch.list(false);

    res.render('admin/branches/index', {
      title: 'إدارة الفروع | الكيف للسيارات',
      branches
    });
  } catch (error) {
    console.error('Admin branches list error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل الفروع');
    res.redirect('/admin');
  }
});

router.get('/branches/create', (req, res) => {
  res.render('admin/branches/form', {
    title: 'إضافة فرع | الكيف للسيارات',
    branch: null
  });
});

router.post('/branches/create', (req, res) => {
  try {
    const { name, address, city, phone, whatsapp_url, working_hours, map_url, sort_order, is_active } = req.body;

    Branch.create({
      name, address, city, phone, whatsapp_url, working_hours, map_url,
      sort_order: sort_order ? parseInt(sort_order) : 0,
      is_active: is_active ? 1 : 0
    });

    req.flash('success', 'تم إضافة الفرع بنجاح');
    res.redirect('/admin/branches');
  } catch (error) {
    console.error('Admin branch create error:', error);
    req.flash('error', 'حدث خطأ أثناء إضافة الفرع');
    res.redirect('/admin/branches/create');
  }
});

router.get('/branches/:id/edit', (req, res) => {
  try {
    const branch = Branch.findById(req.params.id);
    if (!branch) {
      req.flash('error', 'الفرع غير موجود');
      return res.redirect('/admin/branches');
    }

    res.render('admin/branches/form', {
      title: 'تعديل الفرع | الكيف للسيارات',
      branch
    });
  } catch (error) {
    console.error('Admin branch edit form error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل النموذج');
    res.redirect('/admin/branches');
  }
});

router.post('/branches/:id/edit', (req, res) => {
  try {
    const { name, address, city, phone, whatsapp_url, working_hours, map_url, sort_order, is_active } = req.body;

    Branch.update(req.params.id, {
      name, address, city, phone, whatsapp_url, working_hours, map_url,
      sort_order: sort_order ? parseInt(sort_order) : 0,
      is_active: is_active !== undefined ? 1 : 0
    });

    req.flash('success', 'تم تحديث الفرع بنجاح');
    res.redirect('/admin/branches');
  } catch (error) {
    console.error('Admin branch update error:', error);
    req.flash('error', 'حدث خطأ أثناء تحديث الفرع');
    res.redirect(`/admin/branches/${req.params.id}/edit`);
  }
});

router.post('/branches/:id/delete', (req, res) => {
  try {
    Branch.delete(req.params.id);
    req.flash('success', 'تم حذف الفرع بنجاح');
  } catch (error) {
    console.error('Admin branch delete error:', error);
    req.flash('error', 'حدث خطأ أثناء حذف الفرع');
  }
  res.redirect('/admin/branches');
});

// ============================================================
// USERS (admin only)
// ============================================================
router.get('/users', isAdmin, (req, res) => {
  try {
    const users = User.list();

    res.render('admin/users/index', {
      title: 'إدارة المستخدمين | الكيف للسيارات',
      users
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل المستخدمين');
    res.redirect('/admin');
  }
});

router.get('/users/create', isAdmin, (req, res) => {
  res.render('admin/users/form', {
    title: 'إضافة مستخدم | الكيف للسيارات',
    user: null
  });
});

router.post('/users/create', isAdmin, (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password) {
      req.flash('error', 'جميع الحقول المطلوبة يجب ملؤها');
      return res.redirect('/admin/users/create');
    }

    const password_hash = bcrypt.hashSync(password, 10);

    User.create({
      username,
      email,
      password_hash,
      full_name,
      role: role || 'editor'
    });

    req.flash('success', 'تم إضافة المستخدم بنجاح');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Admin user create error:', error);
    req.flash('error', 'حدث خطأ أثناء إضافة المستخدم. قد يكون اسم المستخدم أو البريد مستخدماً');
    res.redirect('/admin/users/create');
  }
});

router.get('/users/:id/edit', isAdmin, (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'المستخدم غير موجود');
      return res.redirect('/admin/users');
    }

    res.render('admin/users/form', {
      title: 'تعديل المستخدم | الكيف للسيارات',
      user
    });
  } catch (error) {
    console.error('Admin user edit form error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل النموذج');
    res.redirect('/admin/users');
  }
});

router.post('/users/:id/edit', isAdmin, (req, res) => {
  try {
    const { username, email, password, full_name, role, is_active } = req.body;

    const updateData = {
      username,
      email,
      full_name,
      role: role || 'editor',
      is_active: is_active !== undefined ? 1 : 0
    };

    // Only update password if provided
    if (password && password.trim()) {
      updateData.password_hash = bcrypt.hashSync(password, 10);
    }

    User.update(req.params.id, updateData);

    req.flash('success', 'تم تحديث المستخدم بنجاح');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Admin user update error:', error);
    req.flash('error', 'حدث خطأ أثناء تحديث المستخدم');
    res.redirect(`/admin/users/${req.params.id}/edit`);
  }
});

router.post('/users/:id/delete', isAdmin, (req, res) => {
  try {
    // Prevent self-delete
    if (parseInt(req.params.id) === req.session.userId) {
      req.flash('error', 'لا يمكنك حذف حسابك الخاص');
      return res.redirect('/admin/users');
    }

    User.delete(req.params.id);
    req.flash('success', 'تم حذف المستخدم بنجاح');
  } catch (error) {
    console.error('Admin user delete error:', error);
    req.flash('error', 'حدث خطأ أثناء حذف المستخدم');
  }
  res.redirect('/admin/users');
});

// ============================================================
// SITE SETTINGS
// ============================================================
router.get('/settings', (req, res) => {
  try {
    const settings = SiteSetting.getAll();

    res.render('admin/settings/index', {
      title: 'إعدادات الموقع | الكيف للسيارات',
      settings
    });
  } catch (error) {
    console.error('Admin settings error:', error);
    req.flash('error', 'حدث خطأ أثناء تحميل الإعدادات');
    res.redirect('/admin');
  }
});

router.post('/settings', (req, res) => {
  try {
    SiteSetting.setMany(req.body);
    req.flash('success', 'تم حفظ الإعدادات بنجاح');
  } catch (error) {
    console.error('Admin settings save error:', error);
    req.flash('error', 'حدث خطأ أثناء حفظ الإعدادات');
  }
  res.redirect('/admin/settings');
});

module.exports = router;

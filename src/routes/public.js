const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const Brand = require('../models/Brand');
const HeroSlide = require('../models/HeroSlide');
const Testimonial = require('../models/Testimonial');
const Branch = require('../models/Branch');

// GET / - Homepage
router.get('/', (req, res) => {
  try {
    const heroSlides = HeroSlide.list();
    const { cars: featuredCars } = Car.list({ is_featured: true, limit: 10 });
    const brands = Brand.list();
    const testimonials = Testimonial.list();

    res.render('public/index', {
      title: 'الكيف للسيارات | الرئيسية',
      heroSlides,
      featuredCars,
      brands,
      testimonials
    });
  } catch (error) {
    console.error('Homepage error:', error);
    res.status(500).render('errors/500', { title: 'خطأ في الخادم | الكيف للسيارات' });
  }
});

// GET /cars - Cars listing with filters
router.get('/cars', (req, res) => {
  try {
    const {
      brand, condition, body_type,
      min_price, max_price, year,
      page, search
    } = req.query;

    const currentPage = parseInt(page) || 1;

    const filters = {};
    if (brand) filters.brand_id = brand;
    if (condition) filters.condition = condition;
    if (body_type) filters.body_type = body_type;
    if (min_price) filters.min_price = parseFloat(min_price);
    if (max_price) filters.max_price = parseFloat(max_price);
    if (year) filters.year = parseInt(year);
    if (search) filters.search = search;

    const { cars, total, pages } = Car.list({
      ...filters,
      page: currentPage,
      limit: 12
    });

    const brandsWithCount = Brand.listWithCarCount();
    const maxPrice = Car.getMaxPrice();

    res.render('public/cars', {
      title: 'الكيف للسيارات | السيارات',
      cars,
      total,
      pages,
      currentPage,
      filters: req.query,
      brandsWithCount,
      maxPrice
    });
  } catch (error) {
    console.error('Cars listing error:', error);
    res.status(500).render('errors/500', { title: 'خطأ في الخادم | الكيف للسيارات' });
  }
});

// GET /cars/:slug - Car detail
router.get('/cars/:slug', (req, res) => {
  try {
    const car = Car.findBySlug(req.params.slug);
    if (!car) {
      return res.status(404).render('errors/404', {
        title: 'السيارة غير موجودة | الكيف للسيارات'
      });
    }

    const carsDropdown = Car.getForDropdown();

    res.render('public/car-detail', {
      title: `الكيف للسيارات | ${car.name_ar || car.name_en}`,
      car,
      carsDropdown
    });
  } catch (error) {
    console.error('Car detail error:', error);
    res.status(500).render('errors/500', { title: 'خطأ في الخادم | الكيف للسيارات' });
  }
});

// GET /brands - Brands listing
router.get('/brands', (req, res) => {
  try {
    const brandsWithCount = Brand.listWithCarCount();

    res.render('public/brands', {
      title: 'الكيف للسيارات | الماركات',
      brandsWithCount
    });
  } catch (error) {
    console.error('Brands page error:', error);
    res.status(500).render('errors/500', { title: 'خطأ في الخادم | الكيف للسيارات' });
  }
});

// GET /about - About page
router.get('/about', (req, res) => {
  try {
    const testimonials = Testimonial.list();

    res.render('public/about', {
      title: 'الكيف للسيارات | من نحن',
      testimonials
    });
  } catch (error) {
    console.error('About page error:', error);
    res.status(500).render('errors/500', { title: 'خطأ في الخادم | الكيف للسيارات' });
  }
});

// GET /contact - Contact page
router.get('/contact', (req, res) => {
  try {
    const branches = Branch.list();

    res.render('public/contact', {
      title: 'الكيف للسيارات | اتصل بنا',
      branches
    });
  } catch (error) {
    console.error('Contact page error:', error);
    res.status(500).render('errors/500', { title: 'خطأ في الخادم | الكيف للسيارات' });
  }
});

// GET /purchase - Purchase request page
router.get('/purchase', (req, res) => {
  try {
    const carsDropdown = Car.getForDropdown();

    res.render('public/purchase', {
      title: 'الكيف للسيارات | طلب شراء',
      carsDropdown
    });
  } catch (error) {
    console.error('Purchase page error:', error);
    res.status(500).render('errors/500', { title: 'خطأ في الخادم | الكيف للسيارات' });
  }
});

module.exports = router;

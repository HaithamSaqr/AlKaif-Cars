const express = require('express');
const path = require('path');
const createSessionMiddleware = require('./config/session');
const flashMiddleware = require('./middleware/flash');
const siteDataMiddleware = require('./middleware/siteData');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(createSessionMiddleware());

// Flash messages
app.use(flashMiddleware);

// Global site data for all views
app.use(siteDataMiddleware);

// Routes
app.use('/', require('./routes/public'));
app.use('/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: 'الصفحة غير موجودة | الكيف للسيارات'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack || err.message);
  res.status(500).render('errors/500', {
    title: 'خطأ في الخادم | الكيف للسيارات'
  });
});

module.exports = app;

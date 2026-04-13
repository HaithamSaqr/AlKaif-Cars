const SiteSetting = require('../models/SiteSetting');
const Brand = require('../models/Brand');

async function siteDataMiddleware(req, res, next) {
  try {
    res.locals.settings = SiteSetting.getAll();
    res.locals.allBrands = Brand.list();
    res.locals.currentPath = req.path;

    res.locals.user = null;
    if (req.session && req.session.userId) {
      res.locals.user = {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.userRole
      };
    }
  } catch (err) {
    // DB may not be ready yet, continue anyway
    res.locals.settings = {};
    res.locals.allBrands = [];
    res.locals.currentPath = req.path;
    res.locals.user = null;
  }

  next();
}

module.exports = siteDataMiddleware;

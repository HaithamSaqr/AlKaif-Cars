function flashMiddleware(req, res, next) {
  if (req.session && req.session.flash) {
    res.locals.flash = req.session.flash;
    delete req.session.flash;
  }

  req.flash = function (type, message) {
    req.session.flash = { type, message };
  };

  next();
}

module.exports = flashMiddleware;

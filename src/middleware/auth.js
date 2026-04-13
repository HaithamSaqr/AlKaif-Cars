function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.redirect('/admin/login');
}

function isAdmin(req, res, next) {
  if (req.session && req.session.userRole === 'admin') {
    return next();
  }
  return res.status(403).render('admin/403', {
    title: 'غير مصرح | الكيف للسيارات'
  });
}

function isEditorOrAdmin(req, res, next) {
  if (req.session && (req.session.userRole === 'admin' || req.session.userRole === 'editor')) {
    return next();
  }
  return res.status(403).render('admin/403', {
    title: 'غير مصرح | الكيف للسيارات'
  });
}

module.exports = { isAuthenticated, isAdmin, isEditorOrAdmin };

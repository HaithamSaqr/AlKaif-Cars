const session = require('express-session');
const ConnectSQLite3 = require('connect-sqlite3')(session);

function createSessionMiddleware() {
  return session({
    store: new ConnectSQLite3({
      db: 'sessions.db',
      dir: './data'
    }),
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  });
}

module.exports = createSessionMiddleware;

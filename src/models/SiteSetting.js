const db = require('../config/database');

const SiteSetting = {
  get(key) {
    const stmt = db.prepare('SELECT value FROM site_settings WHERE key = ?');
    const row = stmt.get(key);
    return row ? row.value : null;
  },

  set(key, value) {
    const stmt = db.prepare(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES (@key, @value, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = @value, updated_at = CURRENT_TIMESTAMP`
    );
    stmt.run({ key, value });
  },

  getAll() {
    const stmt = db.prepare('SELECT key, value FROM site_settings ORDER BY key ASC');
    const rows = stmt.all();
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  },

  setMany(keyValuePairs) {
    const stmt = db.prepare(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES (@key, @value, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = @value, updated_at = CURRENT_TIMESTAMP`
    );

    const transaction = db.transaction((pairs) => {
      for (const [key, value] of Object.entries(pairs)) {
        stmt.run({ key, value });
      }
    });
    transaction(keyValuePairs);
  }
};

module.exports = SiteSetting;

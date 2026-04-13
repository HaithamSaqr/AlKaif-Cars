const db = require('../config/database');

const User = {
  findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  },

  list() {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all();
  },

  create({ username, email, password_hash, full_name, role }) {
    const stmt = db.prepare(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES (@username, @email, @password_hash, @full_name, @role)`
    );
    const result = stmt.run({ username, email, password_hash, full_name, role });
    return result.lastInsertRowid;
  },

  update(id, fields) {
    const allowed = ['username', 'email', 'password_hash', 'full_name', 'role', 'is_active'];
    const entries = Object.entries(fields).filter(([key]) => allowed.includes(key));
    if (entries.length === 0) return false;

    const sets = entries.map(([key]) => `${key} = @${key}`).join(', ');
    const stmt = db.prepare(
      `UPDATE users SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`
    );
    const result = stmt.run({ ...Object.fromEntries(entries), id });
    return result.changes > 0;
  },

  delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  count() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    return stmt.get().count;
  }
};

module.exports = User;

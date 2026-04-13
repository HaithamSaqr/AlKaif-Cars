const db = require('../config/database');

const Brand = {
  list(onlyActive = true) {
    const where = onlyActive ? 'WHERE is_active = 1' : '';
    const stmt = db.prepare(
      `SELECT * FROM brands ${where} ORDER BY sort_order ASC, name_en ASC`
    );
    return stmt.all();
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM brands WHERE id = ?');
    return stmt.get(id);
  },

  findBySlug(slug) {
    const stmt = db.prepare('SELECT * FROM brands WHERE slug = ?');
    return stmt.get(slug);
  },

  create({ name_ar, name_en, slug, logo_path, sort_order }) {
    const stmt = db.prepare(
      `INSERT INTO brands (name_ar, name_en, slug, logo_path, sort_order)
       VALUES (@name_ar, @name_en, @slug, @logo_path, @sort_order)`
    );
    const result = stmt.run({
      name_ar,
      name_en,
      slug,
      logo_path: logo_path || null,
      sort_order: sort_order || 0
    });
    return result.lastInsertRowid;
  },

  update(id, fields) {
    const allowed = ['name_ar', 'name_en', 'slug', 'logo_path', 'sort_order', 'is_active'];
    const entries = Object.entries(fields).filter(([key]) => allowed.includes(key));
    if (entries.length === 0) return false;

    const sets = entries.map(([key]) => `${key} = @${key}`).join(', ');
    const stmt = db.prepare(
      `UPDATE brands SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`
    );
    const result = stmt.run({ ...Object.fromEntries(entries), id });
    return result.changes > 0;
  },

  delete(id) {
    const stmt = db.prepare('DELETE FROM brands WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  count() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM brands');
    return stmt.get().count;
  },

  listWithCarCount() {
    const stmt = db.prepare(
      `SELECT b.*, COUNT(c.id) as car_count
       FROM brands b
       LEFT JOIN cars c ON c.brand_id = b.id AND c.is_active = 1
       WHERE b.is_active = 1
       GROUP BY b.id
       ORDER BY b.sort_order ASC, b.name_en ASC`
    );
    return stmt.all();
  }
};

module.exports = Brand;

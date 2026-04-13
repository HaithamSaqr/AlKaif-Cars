const db = require('../config/database');

const HeroSlide = {
  list(onlyActive = true) {
    const where = onlyActive ? 'WHERE is_active = 1' : '';
    const stmt = db.prepare(
      `SELECT * FROM hero_slides ${where} ORDER BY sort_order ASC, created_at DESC`
    );
    return stmt.all();
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM hero_slides WHERE id = ?');
    return stmt.get(id);
  },

  create(data) {
    const columns = [
      'title', 'subtitle', 'tag', 'brand_watermark', 'price',
      'link_url', 'link_text', 'bg_gradient', 'bg_image_path',
      'sort_order', 'is_active'
    ];
    const present = columns.filter(col => data[col] !== undefined);
    const placeholders = present.map(col => `@${col}`).join(', ');
    const stmt = db.prepare(
      `INSERT INTO hero_slides (${present.join(', ')}) VALUES (${placeholders})`
    );
    const params = {};
    present.forEach(col => { params[col] = data[col]; });

    const result = stmt.run(params);
    return result.lastInsertRowid;
  },

  update(id, data) {
    const allowed = [
      'title', 'subtitle', 'tag', 'brand_watermark', 'price',
      'link_url', 'link_text', 'bg_gradient', 'bg_image_path',
      'sort_order', 'is_active'
    ];
    const entries = Object.entries(data).filter(([key]) => allowed.includes(key));
    if (entries.length === 0) return false;

    const sets = entries.map(([key]) => `${key} = @${key}`).join(', ');
    const stmt = db.prepare(
      `UPDATE hero_slides SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`
    );
    const result = stmt.run({ ...Object.fromEntries(entries), id });
    return result.changes > 0;
  },

  delete(id) {
    const stmt = db.prepare('DELETE FROM hero_slides WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  count() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM hero_slides');
    return stmt.get().count;
  }
};

module.exports = HeroSlide;

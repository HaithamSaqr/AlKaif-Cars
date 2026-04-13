const db = require('../config/database');

const Testimonial = {
  list(onlyActive = true) {
    const where = onlyActive ? 'WHERE is_active = 1' : '';
    const stmt = db.prepare(
      `SELECT * FROM testimonials ${where} ORDER BY sort_order ASC, created_at DESC`
    );
    return stmt.all();
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM testimonials WHERE id = ?');
    return stmt.get(id);
  },

  create(data) {
    const stmt = db.prepare(
      `INSERT INTO testimonials (author_name, author_role, author_initial, content, rating, is_active, sort_order)
       VALUES (@author_name, @author_role, @author_initial, @content, @rating, @is_active, @sort_order)`
    );
    const result = stmt.run({
      author_name: data.author_name,
      author_role: data.author_role || null,
      author_initial: data.author_initial || null,
      content: data.content,
      rating: data.rating || 5,
      is_active: data.is_active !== undefined ? data.is_active : 1,
      sort_order: data.sort_order || 0
    });
    return result.lastInsertRowid;
  },

  update(id, data) {
    const allowed = ['author_name', 'author_role', 'author_initial', 'content', 'rating', 'is_active', 'sort_order'];
    const entries = Object.entries(data).filter(([key]) => allowed.includes(key));
    if (entries.length === 0) return false;

    const sets = entries.map(([key]) => `${key} = @${key}`).join(', ');
    const stmt = db.prepare(
      `UPDATE testimonials SET ${sets} WHERE id = @id`
    );
    const result = stmt.run({ ...Object.fromEntries(entries), id });
    return result.changes > 0;
  },

  delete(id) {
    const stmt = db.prepare('DELETE FROM testimonials WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

module.exports = Testimonial;

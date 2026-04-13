const db = require('../config/database');

const Branch = {
  list(onlyActive = true) {
    const where = onlyActive ? 'WHERE is_active = 1' : '';
    const stmt = db.prepare(
      `SELECT * FROM branches ${where} ORDER BY sort_order ASC, created_at DESC`
    );
    return stmt.all();
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM branches WHERE id = ?');
    return stmt.get(id);
  },

  create(data) {
    const stmt = db.prepare(
      `INSERT INTO branches (name, address, city, phone, whatsapp_url, working_hours, map_url, sort_order, is_active)
       VALUES (@name, @address, @city, @phone, @whatsapp_url, @working_hours, @map_url, @sort_order, @is_active)`
    );
    const result = stmt.run({
      name: data.name,
      address: data.address || null,
      city: data.city || null,
      phone: data.phone || null,
      whatsapp_url: data.whatsapp_url || null,
      working_hours: data.working_hours || null,
      map_url: data.map_url || null,
      sort_order: data.sort_order || 0,
      is_active: data.is_active !== undefined ? data.is_active : 1
    });
    return result.lastInsertRowid;
  },

  update(id, data) {
    const allowed = ['name', 'address', 'city', 'phone', 'whatsapp_url', 'working_hours', 'map_url', 'sort_order', 'is_active'];
    const entries = Object.entries(data).filter(([key]) => allowed.includes(key));
    if (entries.length === 0) return false;

    const sets = entries.map(([key]) => `${key} = @${key}`).join(', ');
    const stmt = db.prepare(
      `UPDATE branches SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`
    );
    const result = stmt.run({ ...Object.fromEntries(entries), id });
    return result.changes > 0;
  },

  delete(id) {
    const stmt = db.prepare('DELETE FROM branches WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

module.exports = Branch;

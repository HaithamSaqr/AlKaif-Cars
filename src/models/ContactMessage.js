const db = require('../config/database');

const ContactMessage = {
  list({ page = 1, limit = 20, is_read } = {}) {
    const conditions = [];
    const params = {};

    if (is_read !== undefined && is_read !== null) {
      conditions.push('is_read = @is_read');
      params.is_read = is_read;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countStmt = db.prepare(
      `SELECT COUNT(*) as total FROM contact_messages ${where}`
    );
    const { total } = countStmt.get(params);

    const stmt = db.prepare(
      `SELECT * FROM contact_messages ${where}
       ORDER BY is_read ASC, created_at DESC
       LIMIT @limit OFFSET @offset`
    );
    const messages = stmt.all({ ...params, limit, offset });

    return {
      messages,
      total,
      pages: Math.ceil(total / limit)
    };
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM contact_messages WHERE id = ?');
    return stmt.get(id);
  },

  create(data) {
    const stmt = db.prepare(
      `INSERT INTO contact_messages (name, email, phone, subject, message)
       VALUES (@name, @email, @phone, @subject, @message)`
    );
    const result = stmt.run({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message
    });
    return result.lastInsertRowid;
  },

  markAsRead(id) {
    const stmt = db.prepare(
      'UPDATE contact_messages SET is_read = 1 WHERE id = ?'
    );
    const result = stmt.run(id);
    return result.changes > 0;
  },

  delete(id) {
    const stmt = db.prepare('DELETE FROM contact_messages WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  count() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM contact_messages');
    return stmt.get().count;
  },

  countUnread() {
    const stmt = db.prepare(
      'SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0'
    );
    return stmt.get().count;
  }
};

module.exports = ContactMessage;

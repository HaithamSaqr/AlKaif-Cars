const db = require('../config/database');

const PurchaseRequest = {
  list({ page = 1, limit = 20, status, type } = {}) {
    const conditions = [];
    const params = {};

    if (status) {
      conditions.push('pr.status = @status');
      params.status = status;
    }
    if (type) {
      conditions.push('pr.request_type = @type');
      params.type = type;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countStmt = db.prepare(
      `SELECT COUNT(*) as total FROM purchase_requests pr ${where}`
    );
    const { total } = countStmt.get(params);

    const stmt = db.prepare(
      `SELECT pr.*, c.name_en as car_name_en
       FROM purchase_requests pr
       LEFT JOIN cars c ON c.id = pr.car_id
       ${where}
       ORDER BY pr.created_at DESC
       LIMIT @limit OFFSET @offset`
    );
    const requests = stmt.all({ ...params, limit, offset });

    return {
      requests,
      total,
      pages: Math.ceil(total / limit)
    };
  },

  findById(id) {
    const stmt = db.prepare(
      `SELECT pr.*, c.name_en as car_name_en
       FROM purchase_requests pr
       LEFT JOIN cars c ON c.id = pr.car_id
       WHERE pr.id = ?`
    );
    return stmt.get(id);
  },

  create(data) {
    const columns = [
      'request_type', 'car_name', 'car_id', 'phone', 'full_name',
      'payment_method', 'salary', 'obligations', 'has_mortgage',
      'first_payment', 'last_payment', 'city', 'employment_sector',
      'bank', 'driving_license', 'price', 'company_name', 'email',
      'ceo_name', 'headquarters', 'business_activity', 'company_age'
    ];
    const present = columns.filter(col => data[col] !== undefined);
    const placeholders = present.map(col => `@${col}`).join(', ');
    const stmt = db.prepare(
      `INSERT INTO purchase_requests (${present.join(', ')}) VALUES (${placeholders})`
    );
    const params = {};
    present.forEach(col => { params[col] = data[col]; });

    const result = stmt.run(params);
    return result.lastInsertRowid;
  },

  updateStatus(id, status, admin_notes) {
    const stmt = db.prepare(
      `UPDATE purchase_requests
       SET status = @status, admin_notes = @admin_notes, updated_at = CURRENT_TIMESTAMP
       WHERE id = @id`
    );
    const result = stmt.run({ id, status, admin_notes: admin_notes || null });
    return result.changes > 0;
  },

  count(status) {
    if (status) {
      const stmt = db.prepare(
        'SELECT COUNT(*) as count FROM purchase_requests WHERE status = ?'
      );
      return stmt.get(status).count;
    }
    const stmt = db.prepare('SELECT COUNT(*) as count FROM purchase_requests');
    return stmt.get().count;
  },

  countNew() {
    const stmt = db.prepare(
      "SELECT COUNT(*) as count FROM purchase_requests WHERE status = 'new'"
    );
    return stmt.get().count;
  }
};

module.exports = PurchaseRequest;

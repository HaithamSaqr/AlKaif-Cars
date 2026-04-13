const db = require('../config/database');

const Car = {
  list({ page = 1, limit = 12, brand_id, condition, body_type, min_price, max_price, year, search, is_featured } = {}) {
    const conditions = ['c.is_active = 1'];
    const params = {};

    if (brand_id) {
      conditions.push('c.brand_id = @brand_id');
      params.brand_id = brand_id;
    }
    if (condition) {
      conditions.push('c.condition = @condition');
      params.condition = condition;
    }
    if (body_type) {
      conditions.push('c.body_type = @body_type');
      params.body_type = body_type;
    }
    if (min_price) {
      conditions.push('c.price >= @min_price');
      params.min_price = min_price;
    }
    if (max_price) {
      conditions.push('c.price <= @max_price');
      params.max_price = max_price;
    }
    if (year) {
      conditions.push('c.year = @year');
      params.year = year;
    }
    if (is_featured) {
      conditions.push('c.is_featured = 1');
    }
    if (search) {
      conditions.push('(c.name_en LIKE @search OR c.name_ar LIKE @search)');
      params.search = `%${search}%`;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countStmt = db.prepare(
      `SELECT COUNT(*) as total FROM cars c ${where}`
    );
    const { total } = countStmt.get(params);

    const stmt = db.prepare(
      `SELECT c.*, b.name_en as brand_name_en, b.name_ar as brand_name_ar, b.slug as brand_slug,
              (SELECT image_path FROM car_images WHERE car_id = c.id AND is_primary = 1 LIMIT 1) as primary_image
       FROM cars c
       LEFT JOIN brands b ON b.id = c.brand_id
       ${where}
       ORDER BY c.is_featured DESC, c.sort_order ASC, c.created_at DESC
       LIMIT @limit OFFSET @offset`
    );
    const cars = stmt.all({ ...params, limit, offset });

    return {
      cars,
      total,
      pages: Math.ceil(total / limit)
    };
  },

  findById(id) {
    const stmt = db.prepare(
      `SELECT c.*, b.name_en as brand_name_en, b.name_ar as brand_name_ar, b.slug as brand_slug
       FROM cars c
       LEFT JOIN brands b ON b.id = c.brand_id
       WHERE c.id = ?`
    );
    return stmt.get(id);
  },

  findBySlug(slug) {
    const carStmt = db.prepare(
      `SELECT c.*, b.name_en as brand_name_en, b.name_ar as brand_name_ar, b.slug as brand_slug
       FROM cars c
       LEFT JOIN brands b ON b.id = c.brand_id
       WHERE c.slug = ?`
    );
    const car = carStmt.get(slug);
    if (!car) return null;

    const imagesStmt = db.prepare(
      'SELECT * FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC'
    );
    car.images = imagesStmt.all(car.id);

    const featuresStmt = db.prepare(
      'SELECT * FROM car_features WHERE car_id = ? ORDER BY sort_order ASC'
    );
    car.features = featuresStmt.all(car.id);

    return car;
  },

  create(data) {
    const columns = [
      'brand_id', 'name_en', 'name_ar', 'slug', 'year', 'price', 'price_on_request',
      'condition', 'body_type', 'fuel_type', 'transmission', 'drivetrain',
      'color_ar', 'color_en', 'mileage', 'engine_size', 'horsepower',
      'seats_material', 'fuel_consumption', 'description_ar', 'description_en',
      'is_featured', 'is_active', 'sort_order'
    ];

    const present = columns.filter(col => data[col] !== undefined);
    const placeholders = present.map(col => `@${col}`).join(', ');
    const stmt = db.prepare(
      `INSERT INTO cars (${present.join(', ')}) VALUES (${placeholders})`
    );
    const params = {};
    present.forEach(col => { params[col] = data[col]; });

    const result = stmt.run(params);
    return result.lastInsertRowid;
  },

  update(id, data) {
    const allowed = [
      'brand_id', 'name_en', 'name_ar', 'slug', 'year', 'price', 'price_on_request',
      'condition', 'body_type', 'fuel_type', 'transmission', 'drivetrain',
      'color_ar', 'color_en', 'mileage', 'engine_size', 'horsepower',
      'seats_material', 'fuel_consumption', 'description_ar', 'description_en',
      'is_featured', 'is_active', 'sort_order'
    ];
    const entries = Object.entries(data).filter(([key]) => allowed.includes(key));
    if (entries.length === 0) return false;

    const sets = entries.map(([key]) => `${key} = @${key}`).join(', ');
    const stmt = db.prepare(
      `UPDATE cars SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`
    );
    const result = stmt.run({ ...Object.fromEntries(entries), id });
    return result.changes > 0;
  },

  delete(id) {
    const stmt = db.prepare(
      'UPDATE cars SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    const result = stmt.run(id);
    return result.changes > 0;
  },

  count(condition) {
    if (condition) {
      const stmt = db.prepare(
        'SELECT COUNT(*) as count FROM cars WHERE is_active = 1 AND condition = ?'
      );
      return stmt.get(condition).count;
    }
    const stmt = db.prepare('SELECT COUNT(*) as count FROM cars WHERE is_active = 1');
    return stmt.get().count;
  },

  getForDropdown() {
    const stmt = db.prepare(
      'SELECT id, name_en, year, price FROM cars WHERE is_active = 1 ORDER BY name_en ASC'
    );
    return stmt.all();
  },

  getMaxPrice() {
    const stmt = db.prepare(
      'SELECT MAX(price) as max_price FROM cars WHERE is_active = 1 AND price IS NOT NULL'
    );
    const row = stmt.get();
    return row ? row.max_price : 0;
  }
};

module.exports = Car;

const db = require('../config/database');

const CarImage = {
  listByCar(car_id) {
    const stmt = db.prepare(
      'SELECT * FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC'
    );
    return stmt.all(car_id);
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM car_images WHERE id = ?');
    return stmt.get(id);
  },

  create({ car_id, image_path, alt_text, sort_order, is_primary }) {
    const stmt = db.prepare(
      `INSERT INTO car_images (car_id, image_path, alt_text, sort_order, is_primary)
       VALUES (@car_id, @image_path, @alt_text, @sort_order, @is_primary)`
    );
    const result = stmt.run({
      car_id,
      image_path,
      alt_text: alt_text || null,
      sort_order: sort_order || 0,
      is_primary: is_primary || 0
    });
    return result.lastInsertRowid;
  },

  delete(id) {
    const stmt = db.prepare('DELETE FROM car_images WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  setPrimary(id, car_id) {
    const resetStmt = db.prepare(
      'UPDATE car_images SET is_primary = 0 WHERE car_id = ?'
    );
    const setStmt = db.prepare(
      'UPDATE car_images SET is_primary = 1 WHERE id = ? AND car_id = ?'
    );

    const transaction = db.transaction(() => {
      resetStmt.run(car_id);
      setStmt.run(id, car_id);
    });
    transaction();
  }
};

module.exports = CarImage;

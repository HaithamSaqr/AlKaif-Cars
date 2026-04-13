const db = require('../config/database');

const CarFeature = {
  listByCar(car_id) {
    const stmt = db.prepare(
      'SELECT * FROM car_features WHERE car_id = ? ORDER BY sort_order ASC'
    );
    return stmt.all(car_id);
  },

  create({ car_id, feature_text, sort_order }) {
    const stmt = db.prepare(
      `INSERT INTO car_features (car_id, feature_text, sort_order)
       VALUES (@car_id, @feature_text, @sort_order)`
    );
    const result = stmt.run({
      car_id,
      feature_text,
      sort_order: sort_order || 0
    });
    return result.lastInsertRowid;
  },

  delete(id) {
    const stmt = db.prepare('DELETE FROM car_features WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  deleteAllByCar(car_id) {
    const stmt = db.prepare('DELETE FROM car_features WHERE car_id = ?');
    const result = stmt.run(car_id);
    return result.changes;
  },

  bulkCreate(car_id, features) {
    const stmt = db.prepare(
      `INSERT INTO car_features (car_id, feature_text, sort_order)
       VALUES (@car_id, @feature_text, @sort_order)`
    );

    const transaction = db.transaction((items) => {
      items.forEach((feature_text, index) => {
        stmt.run({
          car_id,
          feature_text,
          sort_order: index + 1
        });
      });
    });
    transaction(features);
  }
};

module.exports = CarFeature;

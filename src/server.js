require('dotenv').config();

const app = require('./app');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

// Run database migration
const db = require('./config/database');
try {
  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('Database migration completed successfully.');
} catch (error) {
  console.error('Migration warning:', error.message);
}

app.listen(PORT, () => {
  console.log(`El-Kaif Cars server running on http://localhost:${PORT}`);
});

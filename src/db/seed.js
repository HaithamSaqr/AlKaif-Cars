const path = require('path');
const bcrypt = require('bcrypt');
const slugify = require('slugify');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const db = require('../config/database');

function makeSlug(text) {
  return slugify(text, { lower: true, strict: true });
}

function seed() {
  // Check if already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  console.log('Seeding database...');

  const seedAll = db.transaction(() => {
    // ──────────────────────────────────────────────
    // 1. Admin user
    // ──────────────────────────────────────────────
    const passwordHash = bcrypt.hashSync('admin123', 10);
    db.prepare(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES (@username, @email, @password_hash, @full_name, @role)`
    ).run({
      username: 'admin',
      email: 'admin@elkaifcars.com',
      password_hash: passwordHash,
      full_name: '\u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645',
      role: 'admin'
    });
    console.log('  Admin user created.');

    // ──────────────────────────────────────────────
    // 2. Brands (30 + Skoda = 31)
    // ──────────────────────────────────────────────
    const brands = [
      { name_ar: '\u0645\u0631\u0633\u064A\u062F\u0633 \u0628\u0646\u0632', name_en: 'Mercedes-Benz' },
      { name_ar: '\u0628\u064A \u0627\u0645 \u062F\u0628\u0644\u064A\u0648', name_en: 'BMW' },
      { name_ar: '\u062A\u0648\u064A\u0648\u062A\u0627', name_en: 'Toyota' },
      { name_ar: '\u0644\u0643\u0632\u0633', name_en: 'Lexus' },
      { name_ar: '\u0628\u0648\u0631\u0634\u0647', name_en: 'Porsche' },
      { name_ar: '\u0641\u064A\u0631\u0627\u0631\u064A', name_en: 'Ferrari' },
      { name_ar: '\u0623\u0648\u062F\u064A', name_en: 'Audi' },
      { name_ar: '\u0644\u0627\u0646\u062F \u0631\u0648\u0641\u0631', name_en: 'Land Rover' },
      { name_ar: '\u0646\u064A\u0633\u0627\u0646', name_en: 'Nissan' },
      { name_ar: '\u062C\u064A \u0627\u0645 \u0633\u064A', name_en: 'GMC' },
      { name_ar: '\u0643\u0627\u062F\u064A\u0644\u0627\u0643', name_en: 'Cadillac' },
      { name_ar: '\u0631\u0648\u0644\u0632 \u0631\u0648\u064A\u0633', name_en: 'Rolls Royce' },
      { name_ar: '\u0628\u0646\u062A\u0644\u064A', name_en: 'Bentley' },
      { name_ar: '\u0645\u0627\u0643\u0644\u0627\u0631\u064A\u0646', name_en: 'McLaren' },
      { name_ar: '\u0623\u0633\u062A\u0648\u0646 \u0645\u0627\u0631\u062A\u0646', name_en: 'Aston Martin' },
      { name_ar: '\u0644\u0627\u0645\u0628\u0648\u0631\u063A\u064A\u0646\u064A', name_en: 'Lamborghini' },
      { name_ar: '\u0645\u0627\u0632\u062F\u0627', name_en: 'Mazda' },
      { name_ar: '\u0647\u064A\u0648\u0646\u062F\u0627\u064A', name_en: 'Hyundai' },
      { name_ar: '\u0643\u064A\u0627', name_en: 'Kia' },
      { name_ar: '\u062A\u0633\u0644\u0627', name_en: 'Tesla' },
      { name_ar: '\u0641\u0648\u0631\u062F', name_en: 'Ford' },
      { name_ar: '\u0634\u064A\u0641\u0631\u0648\u0644\u064A\u0647', name_en: 'Chevrolet' },
      { name_ar: '\u062C\u064A\u0628', name_en: 'Jeep' },
      { name_ar: '\u062F\u0648\u062F\u062C', name_en: 'Dodge' },
      { name_ar: '\u062C\u0627\u0643\u0648\u0627\u0631', name_en: 'Jaguar' },
      { name_ar: '\u0645\u0627\u0632\u064A\u0631\u0627\u062A\u064A', name_en: 'Maserati' },
      { name_ar: '\u0641\u0648\u0644\u0643\u0633 \u0648\u0627\u062C\u0646', name_en: 'Volkswagen' },
      { name_ar: '\u0647\u0648\u0646\u062F\u0627', name_en: 'Honda' },
      { name_ar: '\u0645\u064A\u062A\u0633\u0648\u0628\u064A\u0634\u064A', name_en: 'Mitsubishi' },
      { name_ar: '\u0628\u064A \u0648\u0627\u064A \u062F\u064A', name_en: 'BYD' },
      { name_ar: '\u0633\u0643\u0648\u062F\u0627', name_en: 'Skoda' }
    ];

    const insertBrand = db.prepare(
      `INSERT INTO brands (name_ar, name_en, slug, sort_order)
       VALUES (@name_ar, @name_en, @slug, @sort_order)`
    );

    brands.forEach((brand, index) => {
      insertBrand.run({
        name_ar: brand.name_ar,
        name_en: brand.name_en,
        slug: makeSlug(brand.name_en),
        sort_order: index + 1
      });
    });
    console.log(`  ${brands.length} brands created.`);

    // Helper to look up brand_id by slug
    const findBrand = db.prepare('SELECT id FROM brands WHERE slug = ?');

    // ──────────────────────────────────────────────
    // 3. Cars (12)
    // ──────────────────────────────────────────────
    const insertCar = db.prepare(
      `INSERT INTO cars (brand_id, name_en, name_ar, slug, year, price, price_on_request,
       condition, body_type, mileage, is_featured, drivetrain, horsepower, engine_size,
       fuel_consumption, seats_material, color_ar, description_ar)
       VALUES (@brand_id, @name_en, @name_ar, @slug, @year, @price, @price_on_request,
       @condition, @body_type, @mileage, @is_featured, @drivetrain, @horsepower, @engine_size,
       @fuel_consumption, @seats_material, @color_ar, @description_ar)`
    );

    const carsData = [
      {
        brand_slug: 'cadillac',
        name_en: 'Cadillac Escalade 2025',
        name_ar: '\u0643\u0627\u062F\u064A\u0644\u0627\u0643 \u0627\u0633\u0643\u0627\u0644\u064A\u062F 2025',
        year: 2025, price: null, price_on_request: 1,
        condition: 'new', body_type: 'suv', mileage: null, is_featured: 1,
        drivetrain: null, horsepower: null, engine_size: null,
        fuel_consumption: null, seats_material: null, color_ar: null, description_ar: null
      },
      {
        brand_slug: 'mazda',
        name_en: 'Mazda 3 2026',
        name_ar: '\u0645\u0627\u0632\u062F\u0627 3 2026',
        year: 2026, price: 108000, price_on_request: 0,
        condition: 'new', body_type: 'sedan', mileage: null, is_featured: 1,
        drivetrain: null, horsepower: null, engine_size: null,
        fuel_consumption: null, seats_material: null, color_ar: null, description_ar: null
      },
      {
        brand_slug: 'bmw',
        name_en: 'BMW 740i 2026',
        name_ar: '\u0628\u064A \u0627\u0645 \u062F\u0628\u0644\u064A\u0648 740i 2026',
        year: 2026, price: 510000, price_on_request: 0,
        condition: 'new', body_type: 'sedan', mileage: null, is_featured: 1,
        drivetrain: '\u062F\u0641\u0639 \u0631\u0628\u0627\u0639\u064A',
        horsepower: 375,
        engine_size: '3.0L',
        fuel_consumption: '8.5L/100km',
        seats_material: '\u062C\u0644\u062F \u0637\u0628\u064A\u0639\u064A',
        color_ar: '\u0623\u0633\u0648\u062F',
        description_ar: '\u0628\u064A \u0627\u0645 \u062F\u0628\u0644\u064A\u0648 \u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0633\u0627\u0628\u0639\u0629 740i \u0645\u0648\u062F\u064A\u0644 2026\u060C \u0633\u064A\u0627\u0631\u0629 \u0633\u064A\u062F\u0627\u0646 \u0641\u0627\u062E\u0631\u0629 \u062A\u062C\u0645\u0639 \u0628\u064A\u0646 \u0627\u0644\u0623\u062F\u0627\u0621 \u0627\u0644\u0631\u064A\u0627\u0636\u064A \u0648\u0627\u0644\u0631\u0641\u0627\u0647\u064A\u0629 \u0627\u0644\u0645\u0637\u0644\u0642\u0629. \u0645\u0632\u0648\u062F\u0629 \u0628\u0645\u062D\u0631\u0643 \u0633\u062A \u0633\u0644\u0646\u062F\u0631\u0627\u062A \u0633\u0639\u0629 3.0 \u0644\u062A\u0631 \u0628\u0642\u0648\u0629 375 \u062D\u0635\u0627\u0646\u060C \u0645\u0639 \u0646\u0638\u0627\u0645 \u062F\u0641\u0639 \u0631\u0628\u0627\u0639\u064A \u0645\u062A\u0637\u0648\u0631 \u0648\u0646\u0627\u0642\u0644 \u062D\u0631\u0643\u0629 \u0623\u0648\u062A\u0648\u0645\u0627\u062A\u064A\u0643\u064A \u0645\u0646 8 \u0633\u0631\u0639\u0627\u062A. \u062A\u062A\u0645\u064A\u0632 \u0628\u062A\u0635\u0645\u064A\u0645 \u062F\u0627\u062E\u0644\u064A \u0641\u0627\u062E\u0631 \u0628\u0645\u0642\u0627\u0639\u062F \u062C\u0644\u062F \u0637\u0628\u064A\u0639\u064A \u0645\u0639 \u0623\u062D\u062F\u062B \u062A\u0642\u0646\u064A\u0627\u062A \u0627\u0644\u0631\u0627\u062D\u0629 \u0648\u0627\u0644\u062A\u0631\u0641\u064A\u0647.'
      },
      {
        brand_slug: 'bmw',
        name_en: 'BMW 735i 2026',
        name_ar: '\u0628\u064A \u0627\u0645 \u062F\u0628\u0644\u064A\u0648 735i 2026',
        year: 2026, price: 469000, price_on_request: 0,
        condition: 'new', body_type: 'sedan', mileage: null, is_featured: 1,
        drivetrain: null, horsepower: null, engine_size: null,
        fuel_consumption: null, seats_material: null, color_ar: null, description_ar: null
      },
      {
        brand_slug: 'gmc',
        name_en: 'GMC Yukon Denali 2024',
        name_ar: '\u062C\u064A \u0627\u0645 \u0633\u064A \u064A\u0648\u0643\u0646 \u062F\u0646\u0627\u0644\u064A 2024',
        year: 2024, price: 320000, price_on_request: 0,
        condition: 'used', body_type: 'suv', mileage: 48159, is_featured: 1,
        drivetrain: null, horsepower: null, engine_size: null,
        fuel_consumption: null, seats_material: null, color_ar: null, description_ar: null
      },
      {
        brand_slug: 'nissan',
        name_en: 'Nissan Patrol SE Platinum 2026',
        name_ar: '\u0646\u064A\u0633\u0627\u0646 \u0628\u0627\u062A\u0631\u0648\u0644 SE \u0628\u0644\u0627\u062A\u064A\u0646\u064A\u0648\u0645 2026',
        year: 2026, price: 335000, price_on_request: 0,
        condition: 'new', body_type: 'suv', mileage: null, is_featured: 1,
        drivetrain: null, horsepower: null, engine_size: null,
        fuel_consumption: null, seats_material: null, color_ar: null, description_ar: null
      },
      {
        brand_slug: 'toyota',
        name_en: 'Toyota Prado TXL3 2026',
        name_ar: '\u062A\u0648\u064A\u0648\u062A\u0627 \u0628\u0631\u0627\u062F\u0648 TXL3 2026',
        year: 2026, price: 245000, price_on_request: 0,
        condition: 'new', body_type: 'suv', mileage: null, is_featured: 1,
        drivetrain: null, horsepower: null, engine_size: null,
        fuel_consumption: null, seats_material: null, color_ar: null, description_ar: null
      },
      {
        brand_slug: 'mercedes-benz',
        name_en: 'Mercedes CLA 200 2022',
        name_ar: '\u0645\u0631\u0633\u064A\u062F\u0633 CLA 200 2022',
        year: 2022, price: 185000, price_on_request: 0,
        condition: 'used', body_type: 'sedan', mileage: 32000, is_featured: 0,
        drivetrain: null, horsepower: null, engine_size: null,
        fuel_consumption: null, seats_material: null, color_ar: null, description_ar: null
      },
      {
        brand_slug: 'audi',
        name_en: 'Audi Q7 55 TFSI 2025',
        name_ar: '\u0623\u0648\u062F\u064A Q7 55 TFSI 2025',
        year: 2025, price: 380000, price_on_request: 0,
        condition: 'new', body_type: 'suv', mileage: null, is_featured: 1,
        drivetrain: null, horsepower: null, engine_size: null,
        fuel_consumption: null, seats_material: null, color_ar: null, description_ar: null
      },
      {
        brand_slug: 'skoda',
        name_en: 'Skoda Kodiaq 2026',
        name_ar: '\u0633\u0643\u0648\u062F\u0627 \u0643\u0648\u062F\u064A\u0627\u0643 2026',
        year: 2026, price: 125000, price_on_request: 0,
        condition: 'new', body_type: 'suv', mileage: null, is_featured: 0,
        drivetrain: null, horsepower: null, engine_size: null,
        fuel_consumption: null, seats_material: null, color_ar: null, description_ar: null
      },
      {
        brand_slug: 'lexus',
        name_en: 'Lexus LX 600 2025',
        name_ar: '\u0644\u0643\u0632\u0633 LX 600 2025',
        year: 2025, price: 420000, price_on_request: 0,
        condition: 'new', body_type: 'suv', mileage: null, is_featured: 0,
        drivetrain: null, horsepower: null, engine_size: null,
        fuel_consumption: null, seats_material: null, color_ar: null, description_ar: null
      },
      {
        brand_slug: 'hyundai',
        name_en: 'Hyundai Tucson 2026',
        name_ar: '\u0647\u064A\u0648\u0646\u062F\u0627\u064A \u062A\u0648\u0633\u0627\u0646 2026',
        year: 2026, price: 115000, price_on_request: 0,
        condition: 'new', body_type: 'suv', mileage: null, is_featured: 1,
        drivetrain: null, horsepower: null, engine_size: null,
        fuel_consumption: null, seats_material: null, color_ar: null, description_ar: null
      }
    ];

    carsData.forEach(car => {
      const brand = findBrand.get(car.brand_slug);
      if (!brand) {
        console.error(`  Brand not found for slug: ${car.brand_slug}`);
        return;
      }
      insertCar.run({
        brand_id: brand.id,
        name_en: car.name_en,
        name_ar: car.name_ar,
        slug: makeSlug(car.name_en),
        year: car.year,
        price: car.price,
        price_on_request: car.price_on_request,
        condition: car.condition,
        body_type: car.body_type,
        mileage: car.mileage,
        is_featured: car.is_featured,
        drivetrain: car.drivetrain,
        horsepower: car.horsepower,
        engine_size: car.engine_size,
        fuel_consumption: car.fuel_consumption,
        seats_material: car.seats_material,
        color_ar: car.color_ar,
        description_ar: car.description_ar
      });
    });
    console.log(`  ${carsData.length} cars created.`);

    // ──────────────────────────────────────────────
    // 4. Car features for BMW 740i
    // ──────────────────────────────────────────────
    const bmw740i = db.prepare("SELECT id FROM cars WHERE slug = ?").get(makeSlug('BMW 740i 2026'));
    if (bmw740i) {
      const features = [
        '\u0646\u0638\u0627\u0645 \u0645\u0644\u0627\u062D\u0629 \u0645\u062A\u0637\u0648\u0631',
        '\u0643\u0627\u0645\u064A\u0631\u0627 \u0645\u062D\u064A\u0637\u064A\u0629 360 \u062F\u0631\u062C\u0629',
        '\u0641\u062A\u062D\u0629 \u0633\u0642\u0641 \u0628\u0627\u0646\u0648\u0631\u0627\u0645\u064A\u0629',
        '\u0645\u0642\u0627\u0639\u062F \u0645\u062F\u0641\u0623\u0629 \u0648\u0645\u0628\u0631\u062F\u0629',
        '\u0646\u0638\u0627\u0645 \u0635\u0648\u062A\u064A Bowers & Wilkins',
        '\u0634\u0627\u0634\u0629 \u0639\u0631\u0636 \u0623\u0645\u0627\u0645\u064A\u0629 HUD',
        '\u0645\u062B\u0628\u062A \u0633\u0631\u0639\u0629 \u062A\u0643\u064A\u0641\u064A',
        '\u0646\u0638\u0627\u0645 \u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0631\u0643\u0646 \u0627\u0644\u0622\u0644\u064A',
        '\u0625\u0636\u0627\u0621\u0629 \u0644\u064A\u0632\u0631\u064A\u0629 LED',
        '\u0646\u0638\u0627\u0645 \u062A\u0639\u0644\u064A\u0642 \u0647\u0648\u0627\u0626\u064A \u062A\u0643\u064A\u0641\u064A',
        '\u0634\u062D\u0646 \u0644\u0627\u0633\u0644\u0643\u064A \u0644\u0644\u0647\u0627\u062A\u0641',
        '\u0645\u0641\u062A\u0627\u062D \u0631\u0642\u0645\u064A \u0630\u0643\u064A'
      ];
      const insertFeature = db.prepare(
        `INSERT INTO car_features (car_id, feature_text, sort_order)
         VALUES (@car_id, @feature_text, @sort_order)`
      );
      features.forEach((text, index) => {
        insertFeature.run({
          car_id: bmw740i.id,
          feature_text: text,
          sort_order: index + 1
        });
      });
      console.log(`  ${features.length} features added to BMW 740i.`);
    }

    // ──────────────────────────────────────────────
    // 5. Hero slides (7)
    // ──────────────────────────────────────────────
    const insertSlide = db.prepare(
      `INSERT INTO hero_slides (title, subtitle, tag, brand_watermark, price, link_url, link_text, bg_gradient, sort_order)
       VALUES (@title, @subtitle, @tag, @brand_watermark, @price, @link_url, @link_text, @bg_gradient, @sort_order)`
    );

    const slides = [
      {
        title: 'Ferrari Purosangue 2024',
        subtitle: '\u062A\u062C\u0631\u0628\u0629 \u0642\u064A\u0627\u062F\u0629 \u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A\u0629 \u0645\u0639 \u0623\u0648\u0644 \u0633\u064A\u0627\u0631\u0629 \u0641\u064A\u0631\u0627\u0631\u064A \u0631\u0628\u0627\u0639\u064A\u0629 \u0627\u0644\u0623\u0628\u0648\u0627\u0628',
        tag: '\u062D\u0635\u0631\u064A',
        brand_watermark: 'FERRARI',
        price: '1250000',
        bg_gradient: 'linear-gradient(135deg, #3d0c0c 0%, #5a1515 30%, #1a0505 70%, #0D0D0D 100%)'
      },
      {
        title: 'Porsche 911 GT3 RS 2024',
        subtitle: null,
        tag: '\u0631\u064A\u0627\u0636\u064A\u0629',
        brand_watermark: 'PORSCHE',
        price: '890000',
        bg_gradient: 'linear-gradient(135deg, #0D0D2e 0%, #1a1a4e 30%, #16213e 70%, #0D0D0D 100%)'
      },
      {
        title: 'Mercedes AMG GT 2024',
        subtitle: null,
        tag: '\u0641\u0627\u062E\u0631\u0629',
        brand_watermark: 'MERCEDES',
        price: '750000',
        bg_gradient: 'linear-gradient(135deg, #2d1f1f 0%, #4a2828 30%, #1a0a0a 70%, #0D0D0D 100%)'
      },
      {
        title: 'Rolls Royce Spectre 2024',
        subtitle: null,
        tag: '\u0643\u0647\u0631\u0628\u0627\u0626\u064A\u0629',
        brand_watermark: 'ROLLS ROYCE',
        price: '1800000',
        bg_gradient: 'linear-gradient(135deg, #1a0a3e 0%, #2a1550 30%, #0f0a1e 70%, #0D0D0D 100%)'
      },
      {
        title: 'BMW M5 2025',
        subtitle: null,
        tag: '\u062C\u062F\u064A\u062F',
        brand_watermark: 'BMW',
        price: '520000',
        bg_gradient: 'linear-gradient(135deg, #0a2a0a 0%, #154015 30%, #0a1a0a 70%, #0D0D0D 100%)'
      },
      {
        title: 'Aston Martin DBX 707 2023',
        subtitle: null,
        tag: 'SUV',
        brand_watermark: 'ASTON MARTIN',
        price: '950000',
        bg_gradient: 'linear-gradient(135deg, #2f2a0a 0%, #4a3f10 30%, #1a150a 70%, #0D0D0D 100%)'
      },
      {
        title: 'Range Rover SV 2024',
        subtitle: null,
        tag: '\u0641\u062E\u0627\u0645\u0629',
        brand_watermark: 'RANGE ROVER',
        price: '680000',
        bg_gradient: 'linear-gradient(135deg, #0a1a3a 0%, #0f2a50 30%, #081525 70%, #0D0D0D 100%)'
      }
    ];

    slides.forEach((slide, index) => {
      insertSlide.run({
        title: slide.title,
        subtitle: slide.subtitle,
        tag: slide.tag,
        brand_watermark: slide.brand_watermark,
        price: slide.price,
        link_url: '/cars',
        link_text: '\u0627\u0643\u062A\u0634\u0641 \u0627\u0644\u0645\u0632\u064A\u062F',
        bg_gradient: slide.bg_gradient,
        sort_order: index + 1
      });
    });
    console.log(`  ${slides.length} hero slides created.`);

    // ──────────────────────────────────────────────
    // 6. Testimonials (3)
    // ──────────────────────────────────────────────
    const insertTestimonial = db.prepare(
      `INSERT INTO testimonials (author_name, author_role, author_initial, content, rating, sort_order)
       VALUES (@author_name, @author_role, @author_initial, @content, @rating, @sort_order)`
    );

    const testimonials = [
      {
        author_name: '\u0645\u062D\u0645\u062F \u0627\u0644\u0623\u062D\u0645\u062F',
        author_role: '\u0639\u0645\u064A\u0644 VIP',
        author_initial: '\u0645',
        content: '\u062A\u062C\u0631\u0628\u0629 \u0634\u0631\u0627\u0621 \u0645\u0645\u062A\u0627\u0632\u0629! \u062A\u0639\u0627\u0645\u0644 \u0627\u0644\u0641\u0631\u064A\u0642 \u0643\u0627\u0646 \u0627\u062D\u062A\u0631\u0627\u0641\u064A \u062C\u062F\u0627\u064B. \u0627\u0634\u062A\u0631\u064A\u062A BMW 740i \u0648\u0643\u0627\u0646\u062A \u0627\u0644\u0633\u064A\u0627\u0631\u0629 \u0628\u062D\u0627\u0644\u0629 \u0645\u0645\u062A\u0627\u0632\u0629. \u0623\u0646\u0635\u062D \u0627\u0644\u062C\u0645\u064A\u0639 \u0628\u0627\u0644\u062A\u0639\u0627\u0645\u0644 \u0645\u0639 \u0627\u0644\u0643\u064A\u0641 \u0644\u0644\u0633\u064A\u0627\u0631\u0627\u062A.',
        rating: 5
      },
      {
        author_name: '\u0633\u0627\u0631\u0629 \u0627\u0644\u0639\u062A\u064A\u0628\u064A',
        author_role: '\u0639\u0645\u064A\u0644\u0629',
        author_initial: '\u0633',
        content: '\u062E\u062F\u0645\u0629 \u0639\u0645\u0644\u0627\u0621 \u0631\u0627\u0626\u0639\u0629 \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u0645\u0633\u062A\u0645\u0631\u0629. \u0633\u0627\u0639\u062F\u0648\u0646\u064A \u0641\u064A \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0633\u064A\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0648\u062A\u0648\u0641\u064A\u0631 \u0623\u0641\u0636\u0644 \u0639\u0631\u0636 \u062A\u0645\u0648\u064A\u0644.',
        rating: 5
      },
      {
        author_name: '\u062E\u0627\u0644\u062F \u0627\u0644\u0634\u0645\u0631\u064A',
        author_role: '\u0639\u0645\u064A\u0644',
        author_initial: '\u062E',
        content: '\u062A\u062C\u0631\u0628\u0629 \u062C\u064A\u062F\u0629 \u0628\u0634\u0643\u0644 \u0639\u0627\u0645. \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u062A\u0646\u0627\u0641\u0633\u064A\u0629 \u0648\u0627\u0644\u062A\u0645\u0648\u064A\u0644 \u0645\u0631\u064A\u062D. \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0643\u0627\u0646 \u0641\u064A \u0627\u0644\u0645\u0648\u0639\u062F \u0627\u0644\u0645\u062D\u062F\u062F.',
        rating: 4
      }
    ];

    testimonials.forEach((t, index) => {
      insertTestimonial.run({
        author_name: t.author_name,
        author_role: t.author_role,
        author_initial: t.author_initial,
        content: t.content,
        rating: t.rating,
        sort_order: index + 1
      });
    });
    console.log(`  ${testimonials.length} testimonials created.`);

    // ──────────────────────────────────────────────
    // 7. Branches (2)
    // ──────────────────────────────────────────────
    const insertBranch = db.prepare(
      `INSERT INTO branches (name, address, city, phone, whatsapp_url, working_hours, sort_order)
       VALUES (@name, @address, @city, @phone, @whatsapp_url, @working_hours, @sort_order)`
    );

    const branchesData = [
      {
        name: '\u0641\u0631\u0639 \u0627\u0644\u062E\u0631\u064A\u0635',
        address: '\u0627\u0644\u0631\u064A\u0627\u0636\u060C \u0637\u0631\u064A\u0642 \u0627\u0644\u062E\u0631\u064A\u0635',
        city: '\u0627\u0644\u0631\u064A\u0627\u0636',
        phone: '920012345',
        whatsapp_url: 'https://wa.me/966920012345',
        working_hours: '\u0627\u0644\u0623\u062D\u062F - \u0627\u0644\u062E\u0645\u064A\u0633: 9 \u0635 - 12 \u0645\u060C 4 \u0645 - 9 \u0645'
      },
      {
        name: '\u0641\u0631\u0639 \u0627\u0644\u0634\u0641\u0627',
        address: '\u0627\u0644\u0631\u064A\u0627\u0636\u060C \u062D\u064A \u0627\u0644\u0634\u0641\u0627',
        city: '\u0627\u0644\u0631\u064A\u0627\u0636',
        phone: '920012345',
        whatsapp_url: 'https://wa.me/966920012345',
        working_hours: '\u0627\u0644\u0623\u062D\u062F - \u0627\u0644\u062E\u0645\u064A\u0633: 9 \u0635 - 12 \u0645\u060C 4 \u0645 - 9 \u0645'
      }
    ];

    branchesData.forEach((branch, index) => {
      insertBranch.run({
        name: branch.name,
        address: branch.address,
        city: branch.city,
        phone: branch.phone,
        whatsapp_url: branch.whatsapp_url,
        working_hours: branch.working_hours,
        sort_order: index + 1
      });
    });
    console.log(`  ${branchesData.length} branches created.`);

    // ──────────────────────────────────────────────
    // 8. Site settings
    // ──────────────────────────────────────────────
    const insertSetting = db.prepare(
      `INSERT INTO site_settings (key, value) VALUES (@key, @value)
       ON CONFLICT(key) DO UPDATE SET value = @value, updated_at = CURRENT_TIMESTAMP`
    );

    const settings = {
      site_name: '\u0627\u0644\u0643\u064A\u0641 \u0644\u0644\u0633\u064A\u0627\u0631\u0627\u062A',
      site_name_en: 'EL-KAIF CARS',
      phone: '920012345',
      email: 'info@elkaifcars.com',
      whatsapp: '966920012345',
      address: '\u0627\u0644\u0631\u064A\u0627\u0636\u060C \u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629',
      years_experience: '75',
      cars_sold: '5000',
      happy_clients: '10000',
      total_brands: '60',
      facebook_url: '#',
      instagram_url: '#',
      twitter_url: '#',
      snapchat_url: '#',
      tiktok_url: '#',
      linkedin_url: '#',
      youtube_url: '#',
      footer_description: '\u0648\u062C\u0647\u062A\u0643 \u0627\u0644\u0623\u0648\u0644\u0649 \u0644\u0627\u0642\u062A\u0646\u0627\u0621 \u0623\u0641\u062E\u0645 \u0627\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0641\u064A \u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629. \u0646\u0648\u0641\u0631 \u0644\u0643 \u062A\u0634\u0643\u064A\u0644\u0629 \u0645\u062A\u0645\u064A\u0632\u0629 \u0645\u0646 \u0627\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0639\u0645\u0644\u0629 \u0645\u0639 \u062E\u062F\u0645\u0627\u062A \u0645\u062A\u0643\u0627\u0645\u0644\u0629.'
    };

    for (const [key, value] of Object.entries(settings)) {
      insertSetting.run({ key, value });
    }
    console.log(`  ${Object.keys(settings).length} site settings created.`);
  });

  // Execute the entire seed in a single transaction
  seedAll();
  console.log('Seeding completed successfully!');
}

try {
  seed();
} catch (error) {
  console.error('Seeding failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}

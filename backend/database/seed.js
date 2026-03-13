/**
 * HMS Database Seed Script
 * Run after schema.sql: node database/seed.js
 * 
 * Creates default users with properly hashed passwords.
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hotel_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

const users = [
  { name: 'Admin User',       email: 'admin@hotel.com',      password: 'admin123',    role: 'admin' },
  { name: 'Manager One',      email: 'manager@hotel.com',    password: 'manager123',  role: 'manager' },
  { name: 'Receptionist One', email: 'reception@hotel.com',  password: 'recept123',   role: 'receptionist' },
  { name: 'Housekeeper One',  email: 'housekeeping@hotel.com',password: 'house123',   role: 'housekeeping' },
];

async function seed() {
  try {
    console.log('🌱 Seeding users...');
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [u.name, u.email, hash, u.role]
      );
      console.log(`  ✅ ${u.role.padEnd(14)} ${u.email}  /  ${u.password}`);
    }
    console.log('\n✅ Seed complete! Use the credentials above to log in.\n');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await pool.end();
  }
}

seed();

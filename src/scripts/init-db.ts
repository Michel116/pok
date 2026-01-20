
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
const { hash, genSalt } = bcrypt;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT
      );
    `);

    console.log('Creating terminals table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS terminals (
        "serialNumber" VARCHAR(255) PRIMARY KEY,
        model VARCHAR(255),
        status VARCHAR(50),
        "boxType" VARCHAR(50),
        position INT,
        "verifiedUntil" TIMESTAMPTZ,
        "lastVerificationDate" TIMESTAMPTZ,
        location JSONB,
        history JSONB,
        "returnedFrom" VARCHAR(255)
      );
    `);
    
    console.log('Creating shelf_sections table...');
    await client.query(`
        CREATE TABLE IF NOT EXISTS shelf_sections (
            id VARCHAR(255) PRIMARY KEY,
            tier VARCHAR(50),
            capacity JSONB
        );
    `);

    console.log('Creating shipments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id SERIAL PRIMARY KEY,
        "terminalId" VARCHAR(255) NOT NULL,
        "shippingDate" TIMESTAMPTZ NOT NULL,
        contragent VARCHAR(255) NOT NULL,
        "statusBeforeShipment" VARCHAR(50)
      );
    `);
    
    console.log('Creating contragents table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS contragents (
        name VARCHAR(255) PRIMARY KEY
      );
    `);

    console.log('Creating verification_requests table...');
    await client.query(`
        CREATE TABLE IF NOT EXISTS verification_requests (
            id VARCHAR(255) PRIMARY KEY,
            status VARCHAR(50),
            "createdAt" TIMESTAMPTZ,
            "processedAt" TIMESTAMPTZ,
            "terminalIds" TEXT[],
            "createdBy" VARCHAR(255)
        );
    `);

    await client.query('COMMIT');
    console.log('Tables created successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', e);
    throw e;
  } finally {
    client.release();
  }
}

async function seedData() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Seed users
        console.log('Seeding users...');
        const adminPassword = process.env.ADMIN_PASSWORD || 'm000M';
        const salt = await genSalt(10);
        const adminPasswordHash = await hash(adminPassword, salt);
        
        await client.query(`
            INSERT INTO users (id, name, email, role, password_hash, avatar_url)
            VALUES ('user-1', 'm', 'admin@example.com', 'Administrator', $1, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxwZXJzb24lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjY1MDkwNzR8MA&ixlib=rb-4.1.0&q=80&w=1080')
            ON CONFLICT (name) DO NOTHING;
        `, [adminPasswordHash]);
        
        // Seed shelf sections
        console.log('Seeding shelf sections...');
        const sections = [
            { id: '12121', tier: 'Верхний', capacity: { type_A: { rows: 2, cols: 5 }, type_B: { rows: 3, cols: 6 } } },
            { id: '12122', tier: 'Верхний', capacity: { type_A: { rows: 2, cols: 5 }, type_B: { rows: 3, cols: 7 } } },
            { id: '12123', tier: 'Верхний', capacity: { type_A: { rows: 2, cols: 5 }, type_B: { rows: 3, cols: 6 } } },
            { id: '12111', tier: 'Нижний', capacity: { type_A: { rows: 3, cols: 5 }, type_B: { rows: 5, cols: 6 } } },
            { id: '12112', tier: 'Нижний', capacity: { type_A: { rows: 3, cols: 6 }, type_B: { rows: 5, cols: 7 } } },
            { id: '12113', tier: 'Нижний', capacity: { type_A: { rows: 3, cols: 5 }, type_B: { rows: 5, cols: 6 } } },
            { id: '12131', tier: 'Аренда', capacity: { type_A: { rows: 2, cols: 5 }, type_B: { rows: 1, cols: 5 } } },
            { id: '12132', tier: 'Аренда', capacity: { type_A: { rows: 2, cols: 5 }, type_B: { rows: 1, cols: 5 } } },
            { id: '12133', tier: 'Аренда', capacity: { type_A: { rows: 2, cols: 5 }, type_B: { rows: 1, cols: 5 } } }
        ];

        for (const section of sections) {
            await client.query(
                `INSERT INTO shelf_sections (id, tier, capacity) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING;`,
                [section.id, section.tier, JSON.stringify(section.capacity)]
            );
        }
        
        // Seed contragents
        console.log('Seeding contragents...');
        const contragents = ['ООО "СтройИнвест"', 'АО "ТехноСтрой"'];
        for (const name of contragents) {
            await client.query(`INSERT INTO contragents (name) VALUES ($1) ON CONFLICT (name) DO NOTHING;`, [name]);
        }
        
        await client.query('COMMIT');
        console.log('Initial data seeded successfully.');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error seeding data:', e);
        throw e;
    } finally {
        client.release();
    }
}

async function main() {
  try {
    await createTables();
    await seedData();
    console.log('Database initialization complete.');
  } catch (e) {
    console.error('An error occurred during database initialization:', e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

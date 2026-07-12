const readline = require('readline');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const BACKEND_DIR = __dirname;
const ENV_PATH = path.join(BACKEND_DIR, '.env');
const SCHEMA_PATH = path.join(BACKEND_DIR, 'src', 'scripts', 'schema.sql');

async function promptPassword() {
  return new Promise((resolve) => {
    rl.question('🔑 Enter your MySQL root password (leave blank if none): ', (answer) => {
      resolve(answer);
    });
  });
}

async function run() {
  console.log('\n🚀 Starting TransitOps Full Database Setup...');
  
  const password = await promptPassword();
  rl.close();

  console.log('\n[1/4] Connecting to MySQL...');
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: password,
      multipleStatements: true
    });
    console.log('✅ Connected successfully!');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Please make sure MySQL is running on port 3306 and the password is correct.');
    process.exit(1);
  }

  console.log('\n[2/4] Creating transitops database and schema...');
  try {
    await connection.query('CREATE DATABASE IF NOT EXISTS transitops;');
    await connection.query('USE transitops;');
    
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    await connection.query(schemaSql);
    console.log('✅ Database and tables created from schema.sql!');
  } catch (err) {
    console.error('❌ Schema creation failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }

  console.log('\n[3/4] Updating .env file with your password...');
  try {
    if (fs.existsSync(ENV_PATH)) {
      let envContent = fs.readFileSync(ENV_PATH, 'utf8');
      envContent = envContent.replace(/^DB_PASSWORD=.*$/m, `DB_PASSWORD=${password}`);
      fs.writeFileSync(ENV_PATH, envContent);
      console.log('✅ .env updated!');
    } else {
      console.warn('⚠️ .env file not found, skipping password update.');
    }
  } catch (err) {
    console.error('❌ Failed to update .env:', err.message);
  }

  console.log('\n[4/4] Running seed script to populate demo data...');
  try {
    execSync('npm run seed', { cwd: BACKEND_DIR, stdio: 'inherit' });
    console.log('\n🎉 FULL DATABASE SYSTEM SUCCESSFULLY CREATED AND SEEDED!');
  } catch (err) {
    console.error('\n❌ Seed script failed.');
  }
}

run();

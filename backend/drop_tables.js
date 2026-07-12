const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'Sumit123',
    database: 'transitops'
  });
  
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  
  const [tables] = await connection.query("SELECT CONCAT('DROP TABLE IF EXISTS `', table_schema, '`.`', table_name, '`;') AS query FROM information_schema.tables WHERE table_schema = 'transitops'");
  
  for (let t of tables) {
    console.log(t.query);
    await connection.query(t.query);
  }
  
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('Tables dropped.');
  process.exit(0);
}
run();

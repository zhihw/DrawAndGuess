const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'zhihw',
  password: '123456',
  database: 'game',
  connectionLimit: 10,
  charset: 'utf8mb4',//support chinese query
});

//for handle multiplayer access the db,have to use pool instead of connection

pool.query(
  `CREATE TABLE IF NOT EXISTS clients (
     userID   VARCHAR(128) NOT NULL PRIMARY KEY,
     nickname VARCHAR(191),
     score    INT NOT NULL DEFAULT 0
   )
     CHARSET=utf8mb4
     COLLATE=utf8mb4_unicode_ci; `,//support chinese sort
  (err) => {
    if (err) {
      console.error('fail:', err);
      process.exit(1); 
    }
  }
);

module.exports = pool;

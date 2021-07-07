const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'yourPassword',
  database: 'spainRecap',
})

module.exports = connection;

const {Sequelize} = require('sequelize');

const isProduction = process.env.NODE_ENV === 'production';

// module.exports = new Sequelize(
//     process.env.DB_NAME,
//     process.env.DB_USER,
//     process.env.DB_PASSWORD,
//     {
//         dialect: 'postgres',
//         host: process.env.DB_HOST,
//         port: process.env.DB_PORT,
//     }
// )

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      dialectOptions: {
        ssl: isProduction ? {
          require: true,
          rejectUnauthorized: false,
        } : false,
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        dialect: 'postgres',
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
      }
    );

module.exports = sequelize;
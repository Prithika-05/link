// prisma.config.js
require('dotenv').config();

module.exports = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js", // Optional: change to your seed script if you use one
  },
  datasource: {
    // Reads your connection string from the .env file
    url: process.env.DATABASE_URL, 
  },
};

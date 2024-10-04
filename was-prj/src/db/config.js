const mongodb = require("mongodb");
const config = require("config");
const winston = require("winston");

const logger = winston.loggers.get("was-logger");

const DB_HOST = config.get("Default.DB_HOST");
const DB_NAME = config.get("Default.DB_NAME");
const client = new mongodb.MongoClient(`mongodb://${DB_HOST}`);

/** @type {mongodb.Db} */
let db = null;

const getDbInstance = async () => {
  if (!db) {
    await client.connect();
    db = client.db(DB_NAME);
    logger.debug("database connected");
  }
  return db;
};

const closeDbConnection = async () => {
  await client.close();
  logger.debug("database close");
  process.exit(0);
};

["SIGINT", "SIGTERM", "SIGQUIT", "SIGHUP"].forEach((sig) => {
  process.on(sig, closeDbConnection);
});

module.exports = {
  getDbInstance,
  closeDbConnection,
};

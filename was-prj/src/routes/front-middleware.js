const config = require("config");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const winston = require("winston");

const logger = winston.loggers.get("was-logger");

const dbHost = config.get("Default.DB_HOST");
const dbName = config.get("Default.SESSION_DB_NAME");
const collectionName = config.util.getEnv("NODE_ENV");

const store = MongoStore.create({
  mongoUrl: `mongodb://${dbHost}`,
  dbName: dbName,
  collectionName: collectionName,
  stringify: false,
});

store.on("error", (err) => {
  logger.error(err);
});

const frontMiddlewares = [
  cookieParser(),
  session({
    secret: config.get("Default.SESSION_SECRET"),
    store: store,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 * 1 }, // 1 day
  }),
];

module.exports = { frontMiddlewares };

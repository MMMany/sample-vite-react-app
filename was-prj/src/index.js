// configuration
const config = require("config");
require("./logger-config");

// packages
const express = require("express");
const cors = require("cors");
const winston = require("winston");
const { NotFoundError } = require("./utils/errors");

const logger = winston.loggers.get("was-logger");

const app = express();

// TODO: Need to HTTPS for sign-in
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const { frontMiddlewares } = require("./routes/front-middleware");

// Link routes
const apiAuth = require("./routes/auth").router;
const apiNotice = require("./routes/notice").router;

[apiAuth, apiNotice].forEach((api) => {
  app.use("/v1", ...frontMiddlewares, api);
});

app.all("*", (req, res) => {
  const err = new NotFoundError(`invalid access (${req.method} ${req.originalUrl})`);
  logger.warn(err.message);
  res.sendStatus(err.status);
});

const PORT = config.get("Default.PORT");
const { getDbInstance } = require("./db/config");

getDbInstance()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`server started on ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error(err.message);
  });

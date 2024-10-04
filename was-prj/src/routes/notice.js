const { Router } = require("express");
const winston = require("winston");
const { BadRequestError, UnauthorizedError } = require("../utils/errors");
const { verifySessionMiddleware } = require("./auth");
const { getNotice, getNoticeById } = require("../dummy-data/notice");

const logger = winston.loggers.get("was-logger");
const router = Router();

router.get("/notice", verifySessionMiddleware, async (req, res) => {
  try {
    const result = await getNotice();
    logger.debug(`RESPONSE : ${JSON.stringify(result, null, 2)}`);
    res.json(result);
  } catch (err) {
    logger.error(err.message);
    res.sendStatus(err.status ?? 500);
  }
});

router.get("/notice/$id", verifySessionMiddleware, async (req, res) => {
  try {
    const result = await getNoticeById(id);
    logger.debug(`RESPONSE : ${result && JSON.stringify(result, null, 2)}`);
    res.json(result);
  } catch (err) {
    logger.error(err.message);
    res.sendStatus(err.status ?? 500);
  }
});

module.exports = { router };

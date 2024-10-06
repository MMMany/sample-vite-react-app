const config = require("config");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { Router } = require("express");
const path = require("path");
const { homedir } = require("os");
const winston = require("winston");
const crypto = require("crypto");
const { BadRequestError, UnauthorizedError } = require("../utils/errors");
const { mongoFindOneUserInfo, mongoInsertOneUserInfo } = require("../db/api");
const { sessionStore } = require("./front-middleware");

const logger = winston.loggers.get("was-logger");
const router = Router();

const secretKey = fs.readFileSync(config.get("Default.PRIVATE_KEY_NAME"));

const generateToken = (payload, expiresIn) => {
  return jwt.sign({ ...payload }, secretKey, { expiresIn });
};

const checkJwtToken = async (token) => {
  try {
    const decoded = jwt.verify(token, secretKey);
    return { ...decoded, expired: false };
  } catch (err) {
    if (err.message === "jwt expired") {
      logger.warn(err.message);
      return {
        ...jwt.verify(token, secretKey, { ignoreExpiration: true }),
        expired: true,
      };
    } else if (err.message === "invalid token") {
      logger.error(err.message);
    }
    return null;
  }
};

const verifySessionMiddleware = async (req, res, next) => {
  const token = req.session["xt-access-token"] ?? null;
  if (!token) throw new BadRequestError("there is no token");

  let refreshed = false;
  const decoded = await checkJwtToken(token);
  if (!decoded.expired) {
    next();
  }

  const refreshToken = req.session["xt-refresh-token"] ?? null;
  if (!refreshToken) throw new BadRequestError("there is no token");
  if (!(await checkJwtToken(refreshToken))) throw new UnauthorizedError("token expired");

  const now = Date.now();
  const payload = { user: decoded.user, ctime: now };
  req.session["xt-access-token"] = generateToken(payload, "1h");
  req.session["xt-refresh-token"] = generateToken(payload, "1d");
  req.session["xt-create-time"] = now;
  refreshed = true;
  logger.debug(`token refreshed (${decoded.user})`);

  next();
};

router.post("/sign-up", async (req, res) => {
  const { name, id, pass } = req.body;

  if (await mongoFindOneUserInfo({ id })) {
    logger.warn("user exist");
    res.sendStatus(400);
    return;
  }

  const encrypted = crypto.createHmac("sha256", secretKey).update(pass).digest("hex");
  const result = await mongoInsertOneUserInfo({ name, id, pass: encrypted, role: "user" });
  if (!result) {
    logger.error(`'${name}' user sign-up failed`);
    res.sendStatus(500);
    return;
  }

  res.sendStatus(200);
});

router.post("/sign-in", (req, res) => {
  // TODO: Need to HTTPS for sign-in
  const { id, pass } = req.body;
  if (!id || !pass) {
    logger.warn("invalid arguments");
    res.sendStatus(400);
    return;
  }
  const userId = req.session["user-id"];
  const token = req.session["xt-access-token"];
  if (userId && token) {
    logger.warn("already signed-in");
    res.sendStatus(400);
    return;
  }
  mongoFindOneUserInfo({ id })
    .then((result) => {
      if (!result) {
        throw new BadRequestError("unknown user");
      }
      const encrypted = crypto.createHmac("sha256", secretKey).update(pass).digest("hex");
      if (result.pass !== encrypted) {
        throw new BadRequestError("invalid user");
      }
      const now = Date.now();
      const payload = { user: id, ctime: now };
      req.session["xt-access-token"] = generateToken(payload, "3h");
      req.session["xt-refresh-token"] = generateToken(payload, "1d");
      req.session["xt-create-time"] = now;
      req.session["user-id"] = id;
      res.sendStatus(200);
    })
    .catch((err) => {
      logger.error(err.message);
      res.sendStatus(err.status ?? 500);
    });
});

router.post("/sign-out", (req, res) => {
  const { id } = req.body;
  const userId = req.session["user-id"];
  const token = req.session["xt-access-token"];
  if (!id || !userId || !token) {
    logger.warn("invalid arguments");
    res.sendStatus(400);
    return;
  }
  if (id !== userId) {
    logger.warn("invalid access");
    res.sendStatus(400);
  }
  req.session = null;
  res.sendStatus(200);
});

module.exports = { router, verifySessionMiddleware };

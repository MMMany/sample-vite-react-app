const config = require("config");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { Router } = require("express");
const path = require("path");
const { homedir } = require("os");
const winston = require("winston");
const crypto = require("crypto");
const { BadRequestError, UnauthorizedError } = require("../utils/errors");
const { mongoFindOneUserInfo } = require("../db/api");

const logger = winston.loggers.get("was-logger");
const router = Router();

const secretKey = fs.readFileSync(path.join(homedir(), ".ssh", config.get("Default.PRIVATE_KEY_NAME")));

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

router.post("/sign-in", (req, res) => {
  // TODO: Need to HTTPS for sign-in
  const { id, pass } = req.body;
  mongoFindOneUserInfo({ id })
    .then((result) => {
      if (!result) {
        throw new BadRequestError("unknown user");
      }
      const key = "test1234test1234";
      const a = crypto.createHmac("sha256", key).update(result.pass).digest("hex");
      const b = crypto.createHmac("sha256", key).update(pass).digest("hex");
      if (a !== b) {
        throw new BadRequestError("invalid user");
      }
      const now = Date.now();
      const payload = { user: id, ctime: now };
      req.session["xt-access-token"] = generateToken(payload, "3h");
      req.session["xt-refresh-token"] = generateToken(payload, "1d");
      req.session["xt-create-time"] = now;
      res.sendStatus(200);
    })
    .catch((err) => {
      logger.error(err.message);
      res.sendStatus(err.status ?? 500);
    });
});

module.exports = { router, verifySessionMiddleware };

const winston = require("winston");
const config = require("config");
const _ = require("lodash");

const { combine, timestamp, label, printf, colorize, errors } = winston.format;

const NODE_ENV = config.util.getEnv("NODE_ENV");

const minimizeLevel = winston.format((info) => {
  return { ...info, level: info.level.toUpperCase()[0] };
});

const logFormats = (name) => {
  return combine(
    label({ label: name }),
    errors({ stack: NODE_ENV !== "production" }),
    minimizeLevel(),
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    printf(({ level, label, message, timestamp, stack }) => {
      return "".concat(
        `[${timestamp}]`,
        `[${label}]`,
        `[${level}]`,
        ` ${_.isString(message) ? message : JSON.stringify(message)}`,
        stack ? `\n${stack}` : ""
      );
    })
  );
};

winston.loggers.add("was-logger", {
  level: NODE_ENV === "production" ? "info" : "debug",
  format: logFormats("WAS"),
  transports: [new winston.transports.Console()],
});

winston.loggers.add("app-logger", {
  level: NODE_ENV === "production" ? "info" : "debug",
  format: logFormats("APP"),
  transports: [new winston.transports.Console()],
});

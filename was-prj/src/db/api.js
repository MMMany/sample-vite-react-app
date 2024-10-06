const mongodb = require("mongodb");
const config = require("config");
const winston = require("winston");
const { getDbInstance } = require("./config");

const logger = winston.loggers.get("was-logger");

/**
 * find a document via given collection name
 * @param {string} collectionName
 * @param {mongodb.Filter<mongodb.BSON.Document>} filter
 * @param {mongodb.FindOptions} options
 */
const _find = async (collectionName, filter = {}, options = {}) => {
  try {
    const db = await getDbInstance();
    const collection = db.collection(collectionName);
    const ret = await collection.find(filter, options).toArray();
    return ret.length > 0 ? ret : null;
  } catch (err) {
    logger.error(err.message);
    return null;
  }
};

/**
 * find one document via given collection name
 * @param {string} collectionName
 * @param {mongodb.Filter<mongodb.BSON.Document>} filter
 * @param {mongodb.FindOptions} options
 */
const _findOne = async (collectionName, filter = {}, options = {}) => {
  try {
    const db = await getDbInstance();
    const collection = db.collection(collectionName);
    return await collection.findOne(filter, options);
  } catch (err) {
    logger.error(err.message);
    return null;
  }
};

const _insertOne = async (collectionName, document = {}, options = {}) => {
  try {
    const db = await getDbInstance();
    const collection = db.collection(collectionName);
    return await collection.insertOne(document, options);
  } catch (err) {
    logger.error(err.message);
    return null;
  }
};

const DB_COL_USERINFO = config.get("Default.DB_COL_USERINFO");

const mongoFindOneUserInfo = async (filter = {}, options = {}) => {
  return await _findOne(DB_COL_USERINFO, filter, options);
};

const mongoInsertOneUserInfo = async (document = {}, options = {}) => {
  return await _insertOne(DB_COL_USERINFO, document, options);
};

module.exports = {
  mongoFindOneUserInfo,
  mongoInsertOneUserInfo,
};

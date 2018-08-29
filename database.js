const secrets = require("./secrets");
const pg = require("pg-promise")();
const dbConfig ="postgres://" + secrets.username + ':' + secrets.databasePassword + "@localhost:5432/hue-addiction";
const db = pg(dbConfig);

module.exports = db;
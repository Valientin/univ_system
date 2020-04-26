const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const config = require(__dirname + '/../config/database.json');
const db = {};

function connect(conf) {
    if (conf.url) {
        return new Sequelize(process.env.DATABASE_URL || conf.url, {
            dialect: 'postgres',
            logging: false,
            dialectOptions: {
                ssl: true
            }
        });
    } else {
        return new Sequelize(conf.database, conf.username, conf.password, {
            dialect: 'postgres',
            logging: false,
            host: conf.host,
            port: process.env.POSTGRESQL_PORT || conf.port || 5432
        });
    }
};

const sequelize = connect(config[process.env.NODE_ENV || 'development']);

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = sequelize['import'](path.join(__dirname, file));
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

const crypto = require('crypto-extra');

module.exports = function(sequelize, DataTypes) {
    const Session = sequelize.define('Session', {
        token: {
            type: DataTypes.STRING,
            allowNull: false
        },
        expiredDate: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        hooks: {
            beforeValidate: function(session) {
                session.token = session.token || crypto.randomString(32);
            }
        }
    });

    Session.associate = function(models) {
        Session.belongsTo(models.User, {
            as: 'user', foreignKey: {
                name: 'userId',
                allowNull: false
            }
        });
    };

    return Session;
};

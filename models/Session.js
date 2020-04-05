module.exports = function(sequelize, DataTypes) {
    const Session = sequelize.define('Session', {
        token: {
            type: DataTypes.STRING,
            allowNull: false
        },
        expiredDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM,
            values: ['student', 'admin', 'teacher']
        }
    });

    Session.associate = function(models) {
        Session.belongsTo(models.User, {
            as: 'user', foreignKey: 'userId'
        });
    };

    return Session;
};

module.exports = function(sequelize, DataTypes) {
    const LearnForm = sequelize.define('LearnForm', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        needPay: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    });

    return LearnForm;
};

module.exports = function(sequelize, DataTypes) {
    const BreakTime = sequelize.define('BreakTime', {
        afterLesson: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 10
            }
        },
        time: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 100
            }
        }
    });

    return BreakTime;
};

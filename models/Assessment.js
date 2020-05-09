module.exports = function(sequelize, DataTypes) {
    const Assessment = sequelize.define('Assessment', {
        max: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        name: DataTypes.STRING,
        description: DataTypes.STRING,
        order: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        indexes: [{
            fields: ['order', 'lessonId'],
            unique: true
        }]
    });

    Assessment.associate = function(models) {
        Assessment.belongsTo(models.Lesson, {
            as: 'lesson', foreignKey: {
                name: 'lessonId',
                allowNull: false
            }
        });
    };

    return Assessment;
};

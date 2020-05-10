module.exports = function(sequelize, DataTypes) {
    const Test = sequelize.define('Test', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        maxAttempts: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        questions: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        paranoid: true
    });

    Test.associate = function(models) {
        Test.belongsTo(models.Lesson, {
            as: 'lesson', foreignKey: {
                name: 'lessonId',
                allowNull: false
            }
        });

        Test.hasMany(models.TestQuestion, {
            as: 'testQuestions', foreignKey: 'testId'
        });

        Test.hasMany(models.TestResult, {
            as: 'testResults', foreignKey: 'testId'
        });
    };

    return Test;
};

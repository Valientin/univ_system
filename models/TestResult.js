module.exports = function(sequelize, DataTypes) {
    const TestResult = sequelize.define('TestResult', {
        questions: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        correctAnswers: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        attempt: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM,
            values: ['started', 'finish'],
            defaultValue: 'started'
        },
        questionsIds: DataTypes.JSONB
    });

    TestResult.associate = function(models) {
        TestResult.belongsTo(models.Test, {
            as: 'test', foreignKey: {
                name: 'testId',
                allowNull: false
            }
        });

        TestResult.belongsTo(models.Student, {
            as: 'student', foreignKey: {
                name: 'studentId',
                allowNull: false
            }
        });
    };

    return TestResult;
};

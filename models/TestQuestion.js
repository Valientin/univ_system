module.exports = function(sequelize, DataTypes) {
    const TestQuestion = sequelize.define('TestQuestion', {
        question: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM,
            values: ['single', 'multiple'],
            defaultValue: 'single'
        }
    });

    TestQuestion.associate = function(models) {
        TestQuestion.belongsTo(models.Test, {
            as: 'test', foreignKey: {
                name: 'testId',
                allowNull: false
            }
        });

        TestQuestion.hasMany(models.TestQuestionOption, {
            as: 'testQuestionOptions', foreignKey: 'testQuestionId'
        });
    };

    return TestQuestion;
};

module.exports = function(sequelize, DataTypes) {
    const TestQuestionOption = sequelize.define('TestQuestionOption', {
        text: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        correctAnswer: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    });

    TestQuestionOption.associate = function(models) {
        TestQuestionOption.belongsTo(models.TestQuestion, {
            as: 'testQuestion', foreignKey: {
                name: 'testQuestionId',
                allowNull: false
            }
        });
    };

    return TestQuestionOption;
};

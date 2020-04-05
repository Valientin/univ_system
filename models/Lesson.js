module.exports = function(sequelize, DataTypes) {
    const Lesson = sequelize.define('Lesson', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });

    Lesson.associate = function(models) {
        Lesson.belongsTo(models.Teacher, {
            as: 'teacher', foreignKey: 'teacherId'
        });
    };

    return Lesson;
};

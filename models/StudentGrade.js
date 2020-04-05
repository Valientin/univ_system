module.exports = function(sequelize, DataTypes) {
    const StudentGrade = sequelize.define('StudentGrade', {
        grade: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });

    StudentGrade.associate = function(models) {
        StudentGrade.belongsTo(models.Student, {
            as: 'student',
            foreignKey: 'studentId',
            allowNull: false
        });

        StudentGrade.belongsTo(models.Lesson, {
            as: 'lesson',
            foreignKey: 'lessonId',
            allowNull: false
        });
    };

    return StudentGrade;
};

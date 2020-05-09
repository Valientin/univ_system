module.exports = function(sequelize, DataTypes) {
    const LessonMaterial = sequelize.define('LessonMaterial', {
        photo: {
            type: DataTypes.JSONB,
            allowNull: false
        }
    });

    LessonMaterial.associate = function(models) {
        LessonMaterial.belongsTo(models.Lesson, {
            as: 'lesson',
            foreignKey: {
                name: 'lessonId',
                allowNull: false
            }
        });
    };

    return LessonMaterial;
};

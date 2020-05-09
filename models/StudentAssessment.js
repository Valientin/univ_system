module.exports = function(sequelize, DataTypes) {
    const StudentAssessment = sequelize.define('StudentAssessment', {
        evaluation: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        indexes: [{
            fields: ['assessmentId', 'studentId'],
            unique: true
        }]
    });

    StudentAssessment.associate = function(models) {
        StudentAssessment.belongsTo(models.Assessment, {
            as: 'assessment', foreignKey: {
                name: 'assessmentId',
                allowNull: false
            }
        });
        StudentAssessment.belongsTo(models.Student, {
            as: 'student', foreignKey: {
                name: 'studentId',
                allowNull: false
            }
        });
    };

    StudentAssessment.upsert = async function(where, values) {
        const existRow = await StudentAssessment.findOne({
            where
        });

        if (existRow) {
            return await existRow.update(values);
        }

        return await StudentAssessment.create(values);
    };

    return StudentAssessment;
};

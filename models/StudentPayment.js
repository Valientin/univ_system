module.exports = function(sequelize, DataTypes) {
    const StudentPayment = sequelize.define('StudentPayment', {
        sum: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM,
            allowNull: false,
            values: ['learnForm', 'reffilBalance']
        }
    });

    StudentPayment.associate = function(models) {
        StudentPayment.belongsTo(models.Student, {
            as: 'student', foreignKey: 'studentId'
        });
    };

    return StudentPayment;
};

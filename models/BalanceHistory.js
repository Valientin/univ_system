module.exports = (sequelize, DataTypes) => {
    const BalanceHistory = sequelize.define('BalanceHistory', {
        paymentId: DataTypes.BIGINT,
        change: {
            allowNull: false,
            type: DataTypes.DECIMAL
        },
        balance: {
            allowNull: false,
            type: DataTypes.DECIMAL
        },
        comment: {
            type: DataTypes.STRING
        }
    }, {
        indexes: [{
            fields: ['studentId']
        }]
    });

    BalanceHistory.associate = function(models) {
        BalanceHistory.belongsTo(models.Student, {
            as: 'student', foreignKey: {
                name: 'studentId',
                allowNull: false
            }
        });
    };

    return BalanceHistory;
};

module.exports = (sequelize, DataTypes) => {
    const BalanceHistory = sequelize.define('BalanceHistory', {
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

        BalanceHistory.belongsTo(models.Payment, {
            as: 'payment', foreignKey: {
                name: 'paymentId',
                allowNull: false
            }
        });
    };

    return BalanceHistory;
};

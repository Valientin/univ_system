module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define('Payment', {
        orderId: {
            allowNull: false,
            type: DataTypes.STRING
        },
        amount: {
            allowNull: false,
            type: DataTypes.DECIMAL
        },
        currency: {
            type: DataTypes.ENUM,
            values: ['UAH'],
            defaultValue: 'UAH'
        },
        status: {
            type: DataTypes.ENUM,
            values: ['new', 'success', 'error', 'sandbox'],
            defaultValue: 'new'
        },
        type: {
            allowNull: false,
            type: DataTypes.ENUM,
            values: ['rechargeBalance']
        }
    }, {
        indexes: [{
            fields: ['studentId']
        }]
    });

    Payment.associate = function(models) {
        Payment.belongsTo(models.Student, {
            as: 'student', foreignKey: {
                name: 'studentId',
                allowNull: false
            }
        });
    };

    return Payment;
};

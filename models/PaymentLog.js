module.exports = (sequelize, DataTypes) => {
    const PaymentLog = sequelize.define('PaymentLog', {
        orderId: DataTypes.STRING,
        request: DataTypes.JSONB,
        response: DataTypes.JSONB,
        type: {
            allowNull: false,
            type: DataTypes.ENUM,
            values: ['client-server', 'server-server', 'callback']
        }
    }, {
        indexes: [{
            fields: ['paymentId']
        }, {
            fields: ['orderId']
        }]
    });

    PaymentLog.associate = function(models) {
        PaymentLog.belongsTo(models.Payment, {
            as: 'payment', foreignKey: {
                name: 'paymentId',
                allowNull: false
            }
        });
    };

    return PaymentLog;
};

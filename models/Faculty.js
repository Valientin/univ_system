module.exports = function(sequelize, DataTypes) {
    const Faculty = sequelize.define('Faculty', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        foundedDate: DataTypes.DATE,
        siteUrl: DataTypes.STRING,
        addittionalInfo: DataTypes.STRING
    });

    return Faculty;
};

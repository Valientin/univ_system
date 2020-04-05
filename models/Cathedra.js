module.exports = function(sequelize, DataTypes) {
    const Cathedra = sequelize.define('Cathedra', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        foundedDate: DataTypes.DATE,
        siteUrl: DataTypes.STRING,
        addittionalInfo: DataTypes.STRING
    });

    Cathedra.associate = function(models) {
        Cathedra.belongsTo(models.Faculty, {
            as: 'faculty', foreignKey: 'facultyId'
        });
    };

    return Cathedra;
};

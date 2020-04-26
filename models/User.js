const crypto = require('crypto');

const HASH_ITERATIONS = 100 * 1000;

module.exports = function(sequelize, DataTypes) {
    const User = sequelize.define('User', {
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [2, 30]
            }
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [2, 30]
            }
        },
        middleName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [2, 30]
            }
        },
        loginName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [2, 30],
                isAlphanumeric: true
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        roleName: {
            type: DataTypes.ENUM,
            allowNull: false,
            values: ['student', 'teacher', 'admin']
        },
        passwordSalt: DataTypes.STRING,
        passwordHash: DataTypes.STRING,
        photoPath: DataTypes.STRING,
        birthday: {
            type: DataTypes.DATE,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM,
            allowNull: false,
            values: ['online', 'offline']
        },
        lastActiveTime: DataTypes.DATE
    }, {
        indexes: [{
            fields: ['email'],
            unique: true
        }, {
            fields: ['loginName'],
            unique: true
        }]
    });

    User.associate = function(models) {
        User.hasOne(models.Student, {
            as: 'student', foreignKey: 'userId'
        });

        User.hasOne(models.Teacher, {
            as: 'teacher', foreignKey: 'userId'
        });
    };

    User.prototype.hasPassword = async function(password) {
        const user = this;

        return await new Promise(function(resolve, reject) {
            crypto.pbkdf2(password, user.passwordSalt, HASH_ITERATIONS, 64, `sha1`, (err, hash) => {
                if (err) {
                    reject(new Error(err));
                };

                resolve(hash.toString('base64') === user.passwordHash);
            });
        });
    };

    User.prototype.setPassword = async function(password, transaction = null) {
        const user = this;

        user.passwordSalt = crypto.randomBytes(64).toString('base64');
        user.passwordHash = await new Promise(function(resolve, reject) {
            crypto.pbkdf2(password, user.passwordSalt, HASH_ITERATIONS, 64, `sha1`, (err, hash) => {
                if (err) {
                    reject(new Error(err));
                };

                resolve(hash.toString('base64'));
            });
        });

        await user.save({ transaction });
    };

    return User;
};

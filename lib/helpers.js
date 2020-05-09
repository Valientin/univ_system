const crypto = require('crypto');
const logger = require('./logger');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const generateFileName = (filename) => {
    return `${crypto.pseudoRandomBytes(16).toString('hex')}${path.extname(filename)}`;
};

const sharpImage = async function(ctx) {
    const destination = 'uploads/';

    if (ctx.file) {
        const filename = generateFileName(ctx.file.originalname);

        await sharp(ctx.file.buffer)
            .resize(900)
            .toFile(
                path.resolve(
                    destination,
                    filename
                )
            );

        return {
            filename,
            path: path.join('uploads', filename),
            originalname: ctx.file.originalname
        };
    }
};

const deleteFile = function(path) {
    if (path && !/default.png/.test(path)) {
        fs.unlink(path, function(err) {
            if (err && err.code == 'ENOENT') {
                logger.info(`File '${path}' doesn\'t exist, won\'t remove it.`);
            } else if (err) {
                logger.error(`Error occurred while trying to remove file '${path}'`);
            } else {
                logger.info(`Success removed file '${path}'`);
            }
        });
    }
};

module.exports = {
    deleteFile,
    sharpImage,
    generateFileName
};

/* eslint-disable no-console */
const { promises: fs } = require('fs');
const path = require('path');
const chalk = require('chalk');
const { BUILD_PATH, ENV_MAP } = require('./consts');
const config = require('../package');

const content = `version=${config.version}`;
const { NODE_ENV } = process.env;
const { outputPath } = ENV_MAP[NODE_ENV];
const FILENAME = 'build.txt';

const WRITE_PATH = path.resolve(__dirname, BUILD_PATH, outputPath, FILENAME);

const createBuildVersion = async () => {
    try {
        await fs.writeFile(WRITE_PATH, content);
        console.log(chalk.greenBright(`${FILENAME} saved in ${WRITE_PATH}\n`));
    } catch (error) {
        console.error(chalk.redBright(`Error: Can not create ${FILENAME} - ${error.message}\n`));
        throw error;
    }
};

createBuildVersion();
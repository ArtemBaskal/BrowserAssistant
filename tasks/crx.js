/* eslint-disable no-console */
const { promises: fs } = require('fs');
const path = require('path');
const Crx = require('crx');
const chalk = require('chalk');
const {
    CHROME_UPDATE_URL, MANIFEST_NAME, BROWSER_TYPES, BUILD_PATH, ENV_MAP, CERTIFICATE_PATH,
    CHROME_UPDATE_CRX, CHROME_UPDATER_FILENAME,
} = require('./consts');
const { updateManifest } = require('./helpers');
const config = require('../package');

const CRX_FILENAME = `${config.name}-${config.version}.crx`;
const { NODE_ENV } = process.env;
const { outputPath } = ENV_MAP[NODE_ENV];

const WRITE_PATH = path.resolve(__dirname, BUILD_PATH, outputPath);
const LOAD_PATH = path
    .resolve(__dirname, BUILD_PATH, outputPath, BROWSER_TYPES.CHROME);
const MANIFEST_PATH = path.resolve(
    __dirname, BUILD_PATH, outputPath, BROWSER_TYPES.CHROME, MANIFEST_NAME
);

const getPrivateKey = async () => {
    let privateKey;
    try {
        privateKey = await fs.readFile(CERTIFICATE_PATH);
        console.log(chalk.greenBright(`\nThe certificate is read from ${CERTIFICATE_PATH}\n`));
    } catch (error) {
        console.error(chalk.redBright(`Can not create ${CRX_FILENAME} - the valid certificate is not found in ${CERTIFICATE_PATH} - ${error.message}\n`));
        throw error;
    }
    return privateKey;
};

/**
 * Writes additionalProps to the chromeManifest
 *
 * @param chromeManifest {object}
 * @param [additionalProps] {object} - props to add in manifest
 */
const updateChromeManifest = async (chromeManifest, additionalProps) => {
    try {
        const updatedManifest = updateManifest(chromeManifest, additionalProps);
        await fs.writeFile(MANIFEST_PATH, updatedManifest);

        const info = chromeManifest && additionalProps
            ? `is updated with properties ${JSON.stringify(additionalProps)} to create ${CRX_FILENAME} at ${MANIFEST_PATH}`
            : 'is reset';

        console.log(chalk.greenBright(`${MANIFEST_NAME} ${info}\n`));
    } catch (error) {
        console.error(chalk.redBright(`Error: Can not update ${MANIFEST_NAME} - ${error.message}\n`));
        throw error;
    }
};

const createCrx = async (loadedFile) => {
    try {
        const crxBuffer = await loadedFile.pack();
        const writePath = path.resolve(WRITE_PATH, CRX_FILENAME);
        await fs.writeFile(writePath, crxBuffer);
        console.log(chalk.greenBright(`${CRX_FILENAME} saved in ${WRITE_PATH}\n`));
    } catch (error) {
        console.error(chalk.redBright(`Error: Can not create ${CRX_FILENAME} - ${error.message}\n`));
        throw error;
    }
};

const createXml = async (crx) => {
    try {
        const xmlBuffer = await crx.generateUpdateXML();
        const writeXmlPath = path.resolve(WRITE_PATH, CHROME_UPDATER_FILENAME);
        await fs.writeFile(writeXmlPath, xmlBuffer);
        console.log(chalk.greenBright(`${CHROME_UPDATER_FILENAME} saved in ${WRITE_PATH}\n`));
    } catch (error) {
        console.error(chalk.redBright(error.message));
    }
};

const generateChromeFiles = async () => {
    try {
        const chromeManifest = await fs.readFile(MANIFEST_PATH);
        const PRIVATE_KEY = await getPrivateKey();

        const crx = new Crx({
            codebase: CHROME_UPDATE_CRX,
            privateKey: PRIVATE_KEY,
            publicKey: config.name,
        });

        // Add to the chrome manifest `update_url` property
        // which is to be present while creating the crx file
        await updateChromeManifest(chromeManifest, { update_url: CHROME_UPDATE_URL });
        const loadedFile = await crx.load(LOAD_PATH);
        await createCrx(loadedFile);
        await createXml(crx);
        // Delete from the chrome manifest `update_url` property
        // after the crx file has been created - reset the manifest
        await updateChromeManifest(chromeManifest);
    } catch (error) {
        console.error(error.message);
    }
};

generateChromeFiles();

const path = require('path');
const [twoskyConfig] = require('../.twosky.json');

const SRC_PATH = '../src';
const LOCALES_PATH = path.join(__dirname, SRC_PATH, '_locales/en/messages');
const ENV_MAP = {
    dev: {
        outputPath: 'dev',
        name: 'Dev',
    },
    beta: {
        outputPath: 'beta',
        name: 'Beta',
    },
    release: {
        outputPath: 'release',
        name: '',
    },
};

const BROWSER_TYPES = {
    CHROME: 'chrome',
    FIREFOX: 'firefox',
    EDGE: 'edge',
};

const IS_DEV = process.env.NODE_ENV === 'dev';

// Build output path
const BUILD_PATH = '../build';
const CRX_NAME = 'chrome.crx';
const XPI_NAME = 'firefox.xpi';
const CHROME_UPDATER_FILENAME = 'update.xml';
const FIREFOX_UPDATER_FILENAME = 'update.json';
const MANIFEST_NAME = 'manifest.json';

// Chrome CRX certificate path
const CERTIFICATE_PATH = './private/AdguardBrowserAssistant/certificate.pem';

const CHANNEL = ENV_MAP[process.env.NODE_ENV].outputPath;

// Update manifest URL for the Chrome extension
const CHROME_UPDATE_URL = `https://static.adguard.com/extensions/browserassistant/${CHANNEL}/${CHROME_UPDATER_FILENAME}`;

// Update manifest URL for the Firefox add-on
const FIREFOX_UPDATE_URL = `https://static.adguard.com/extensions/browserassistant/${CHANNEL}/${FIREFOX_UPDATER_FILENAME}`;

// Path to the Chrome CRX (that we'll add to the update manifest)
const CHROME_UPDATE_CRX = `https://static.adguard.com/extensions/browserassistant/${CHANNEL}/${CRX_NAME}`;

// Path to the Firefox XPI (that we'll add to the update manifest)
const FIREFOX_UPDATE_XPI = `https://static.adguard.com/extensions/browserassistant/${CHANNEL}/${XPI_NAME}`;

const { base_locale: BASE_LOCALE, project_id: PROJECT_ID, languages: LANGUAGES } = twoskyConfig;

/**
 * Users locale may be defined with only two chars (language code)
 * Here we provide a map of equivalent translation for such locales
 */
const LOCALES_EQUIVALENTS_MAP = {
    'pt-BR': 'pt',
    'zh-CN': 'zh',
};

module.exports = {
    LOCALES_PATH,
    ENV_MAP,
    SRC_PATH,
    IS_DEV,
    BUILD_PATH,
    CERTIFICATE_PATH,
    MANIFEST_NAME,
    BROWSER_TYPES,
    CHROME_UPDATE_URL,
    FIREFOX_UPDATE_URL,
    CHROME_UPDATE_CRX,
    FIREFOX_UPDATE_XPI,
    CHROME_UPDATER_FILENAME,
    FIREFOX_UPDATER_FILENAME,
    CRX_NAME,
    XPI_NAME,
    BASE_LOCALE, // TODO do not use directly outside of tasks
    PROJECT_ID,
    LANGUAGES, // TODO do not use directly outside of tasks
    LOCALES_EQUIVALENTS_MAP, // TODO do not use directly outside of tasks
};

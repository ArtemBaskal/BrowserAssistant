import browser from 'webextension-polyfill';
import nanoid from 'nanoid';
import AbstractApi from './AbstractApi';
import log from '../../lib/logger';
import versions from '../versions';
import {
    ADG_PREFIX,
    ASSISTANT_TYPES,
    CUSTOM_REQUEST_PREFIX,
    HOST_TYPES,
    REQUEST_TYPES,
} from '../../lib/types';

/**
 * Module implements methods used to communicate with native host via native messaging
 * https://developer.chrome.com/apps/nativeMessaging
 */
class NativeHostApi extends AbstractApi {
    listeners = [];

    constructor() {
        super();
        this.initModule();
    }

    async initModule() {
        try {
            await this.connect();
        } catch (e) {
            log.debug(e);
        }
    }

    /**
     * Distributes messages to the listeners
     * @param incomingMessage
     * @returns {Promise<void>}
     */
    incomingMessageHandler = async (incomingMessage) => {
        log.debug(`Received response: ${incomingMessage.requestId}`, incomingMessage);

        // Ignore requests without identifying prefix ADG
        if (!incomingMessage.requestId.startsWith(ADG_PREFIX)) {
            return;
        }

        // Ignore requests with single request prefix, they have their own handlers
        if (incomingMessage.requestId.includes(CUSTOM_REQUEST_PREFIX)) {
            return;
        }

        // Call listener callbacks
        if (this.listeners.length > 0) {
            this.listeners.forEach((listener) => {
                listener.call(null, incomingMessage);
            });
        }
    };

    /**
     * Adds listener to the listeners list
     * @param {function} listener
     */
    addMessageListener = (listener) => {
        this.listeners = [...this.listeners, listener];
    };

    /**
     * Removes listener from listeners list
     * @param {function} listener
     */
    removeMessageListener = (listener) => {
        this.listeners = this.listeners.filter((l) => l !== listener);
    };

    /**
     * Is called on connection or reconnection
     * @param handler
     */
    addInitMessageHandler = (handler) => {
        this.initMessageHandler = handler;
    };

    /**
     * Connect to the native host
     */
    connect = async () => {
        log.info('Connecting to the native host');
        this.port = browser.runtime.connectNative(HOST_TYPES.browserExtensionHost);

        this.port.onMessage.addListener(this.incomingMessageHandler);

        this.port.onDisconnect.addListener(
            (details) => {
                // firefox keeps errors in the details object
                if (details.error) {
                    log.error(details.error);
                }
                // chrome keeps error in the runtime.lastError object
                if (browser.runtime.lastError) {
                    log.error(browser.runtime.lastError.message);
                }
            }
        );

        await this.sendInitialRequest(false);
    };

    sendInitialRequest = async (shouldReconnect) => {
        const { version, apiVersion, userAgent } = versions;
        const response = await this.init({ version, userAgent, apiVersion }, shouldReconnect);
        this.initMessageHandler(response);
    };

    /**
     * Disconnect from the native host
     */
    disconnect = () => {
        log.debug('Disconnecting from native host');
        this.port.disconnect();
        this.port.onMessage.removeListener(this.incomingMessageHandler);
    };

    /**
     * Reconnect to the native host
     */
    reconnect = async () => {
        log.debug('Trying to reconnect to native host...');
        this.disconnect();
        await this.connect();
    };

    /**
     * Makes request with reconnection by default
     * @param params
     * @param tryReconnect - by default function retries to reconnect
     * @returns {Promise<*>}
     */
    makeRequest = async (params, tryReconnect = true) => {
        try {
            return await this.makeRequestOnce(params);
        } catch (e) {
            if (tryReconnect) {
                log.debug('Was unable to send request');
                try {
                    await this.reconnect();
                    return await this.makeRequestOnce(params);
                } catch (e) {
                    log.debug('Was unable to reconnect to the native host');
                    throw e;
                }
            }
            throw (e);
        }
    };

    makeRequestOnce = async (params) => {
        const RESPONSE_TIMEOUT_MS = 10 * 1000;

        const HOST_RESPONSE_TYPES = {
            OK: 'ok',
            ERROR: 'error',
        };

        // Use CUSTOM_REQUEST_PREFIX in order to ignore this requests in the incomingMessageHandler
        const id = `${ADG_PREFIX}_${CUSTOM_REQUEST_PREFIX}_${nanoid()}`;

        log.info(`Sending request: ${id}`, params);

        return new Promise((resolve, reject) => {
            let timerId;

            const messageHandler = (message) => {
                const { requestId, result } = message;

                if (id === requestId) {
                    this.port.onMessage.removeListener(messageHandler);
                    clearTimeout(timerId);

                    if (result === HOST_RESPONSE_TYPES.OK) {
                        resolve(message);
                        return;
                    }

                    if (result === HOST_RESPONSE_TYPES.ERROR) {
                        reject(new Error(`Native host responded with message: ${message.data}.`));
                    }
                }
            };

            timerId = setTimeout(() => {
                reject(new Error('Native host is not responding too long'));
                this.port.onMessage.removeListener(messageHandler);
            }, RESPONSE_TIMEOUT_MS);

            this.port.onDisconnect.addListener(() => {
                if (browser.runtime.lastError) {
                    reject(new Error(browser.runtime.lastError.message));
                }
            });

            this.port.onMessage.addListener(messageHandler);
            try {
                this.port.postMessage({ id, ...params });
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * Sends initial request to the native host
     * @param parameters
     * @param {string} parameters.version
     * @param {string} parameters.userAgent
     * @param {string} parameters.apiVersion
     * @param {boolean} tryReconnect
     * @returns {Promise<*>}
     */
    init = ({ version, userAgent, apiVersion }, tryReconnect = false) => {
        return this.makeRequest({
            type: REQUEST_TYPES.init,
            parameters: {
                version,
                apiVersion,
                userAgent,
                type: ASSISTANT_TYPES.nativeAssistant,
            },
        }, tryReconnect);
    };

    /**
     * Returns current app state
     */
    getCurrentAppState = async () => {
        const response = await this.makeRequest({
            type: REQUEST_TYPES.getCurrentAppState,
        });
        return response.appState;
    };

    /**
     * Returns filtering state for url, used to get state of current tab
     * @param {string} url
     * @param {number} port
     * @param {boolean} forceStartApp
     */
    getCurrentFilteringState = (url, port, forceStartApp = false) => {
        return this.makeRequest({
            type: REQUEST_TYPES.getCurrentFilteringState,
            parameters: { url, port, forceStartApp },
        });
    };

    /**
     * Sets protections status of the app
     * @param {boolean} isEnabled
     */
    setProtectionStatus = (isEnabled) => this.makeRequest({
        type: REQUEST_TYPES.setProtectionStatus,
        parameters: { isEnabled },
    });

    /**
     * Sets filtering status
     * @param {boolean} isEnabled
     * @param {boolean} isHttpsEnabled
     * @param {string} url
     */
    setFilteringStatus = (isEnabled, isHttpsEnabled, url) => this.makeRequest({
        type: REQUEST_TYPES.setFilteringStatus,
        parameters: { isEnabled, isHttpsEnabled, url },
    });

    /**
     * @param {string} ruleText
     * @returns {Promise<object>}
     */
    addRule = (ruleText) => this.makeRequest({
        type: REQUEST_TYPES.addRule,
        parameters: { ruleText },
    });

    /**
     * @param {string} url
     * @returns {Promise<object>}
     */
    removeCustomRules = (url) => {
        return this.makeRequest({
            type: REQUEST_TYPES.removeCustomRules,
            parameters: { url },
        });
    };

    /**
     * @param {string} domain
     * @param {number} port
     * @returns {Promise<object>}
     */
    openOriginalCert = (domain, port) => this.makeRequest({
        type: REQUEST_TYPES.openOriginalCert,
        parameters: { domain, port },
    });

    /**
     * @param {string} url
     * @param {string} referrer
     * @returns {Promise<object>}
     */
    reportSite = (url, referrer) => this.makeRequest({
        type: REQUEST_TYPES.reportSite,
        parameters: {
            url,
            referrer,
            userAgent: versions.userAgent,
        },
    });

    /**
     * Sends message to open filtering log
     */
    openFilteringLog = () => this.makeRequest({
        type: REQUEST_TYPES.openFilteringLog,
    });

    /**
     * Sends message to open settings
     */
    openSettings = () => this.makeRequest({
        type: REQUEST_TYPES.openSettings,
    });

    /**
     * Sends message to update app
     */
    updateApp = () => this.makeRequest({
        type: REQUEST_TYPES.updateApp,
    });
}

export default new NativeHostApi();
import { POPUP_MESSAGES, CONTENT_MESSAGES } from '../lib/types';
import tabs from './tabs';
import state from './state';

/**
 * Handles incoming messages to the background page
 * @param message
 * @param {string} message.type
 * @param {*} message.data
 * @returns {Promise<*>}
 */
const messageHandler = async (message) => {
    const { type, data } = message;

    switch (type) {
        case POPUP_MESSAGES.GET_POPUP_DATA: {
            try {
                await state.getCurrentAppState();
            } catch (e) {
                return {
                    appState: state.getAppState(),
                    updateStatusInfo: state.getUpdateStatusInfo(),
                    hostError: e.message,
                };
            }

            const { hostInfo } = state;

            // There is no need to check tab info if app is not working
            if (!state.isAppWorking()) {
                return {
                    appState: state.getAppState(),
                    updateStatusInfo: state.getUpdateStatusInfo(),
                };
            }

            const { tab } = data;
            const referrer = await tabs.getReferrer(tab);
            const updateStatusInfo = state.getUpdateStatusInfo();
            const appState = state.getAppState();
            let currentFilteringState;
            try {
                currentFilteringState = await state.getCurrentFilteringState(tab);
            } catch (e) {
                const updateStatusInfo = await state.getUpdateStatusInfo();
                const appState = await state.getAppState();
                return {
                    referrer,
                    updateStatusInfo,
                    appState,
                    hostError: e.message,
                    hostInfo,
                };
            }

            // For pages without http or https currentFilteringState would be null
            if (!currentFilteringState) {
                const updateStatusInfo = await state.getUpdateStatusInfo();
                const appState = await state.getAppState();
                return {
                    referrer,
                    updateStatusInfo,
                    appState,
                    hostInfo,
                };
            }

            return {
                referrer,
                updateStatusInfo,
                appState,
                currentFilteringState,
                hostInfo,
            };
        }

        case POPUP_MESSAGES.GET_APP_LOCALE: {
            return state.getLocale();
        }

        case POPUP_MESSAGES.GET_CURRENT_FILTERING_STATE: {
            const { tab, forceStart } = data;
            return state.getCurrentFilteringState(tab, forceStart);
        }

        case POPUP_MESSAGES.GET_APP_STATE: {
            return {
                appState: state.getAppState(),
                updateStatusInfo: state.getUpdateStatusInfo(),
            };
        }

        case POPUP_MESSAGES.SET_PROTECTION_STATUS: {
            const { isEnabled } = data;
            const resultAppState = await state.setProtectionStatus(isEnabled);
            return Promise.resolve(resultAppState);
        }

        case POPUP_MESSAGES.SET_FILTERING_STATUS: {
            const { isEnabled, isHttpsEnabled, url } = data;
            await state.setFilteringStatus(
                isEnabled,
                isHttpsEnabled,
                url
            );
            break;
        }

        case POPUP_MESSAGES.REMOVE_CUSTOM_RULES: {
            const { url } = data;
            await state.removeCustomRules(url);
            break;
        }

        case POPUP_MESSAGES.OPEN_ORIGINAL_CERT: {
            const { domain, port } = data;
            await state.openOriginalCert(domain, port);
            break;
        }

        case POPUP_MESSAGES.REPORT_SITE: {
            const { url, referrer } = data;
            const reportUrl = await state.reportSite(url, referrer);
            await tabs.openPage(reportUrl);
            break;
        }

        case POPUP_MESSAGES.OPEN_FILTERING_LOG: {
            await state.openFilteringLog();
            break;
        }

        case POPUP_MESSAGES.OPEN_SETTINGS: {
            await state.openSettings();
            break;
        }

        case POPUP_MESSAGES.UPDATE_APP: {
            await state.updateApp();
            break;
        }

        case POPUP_MESSAGES.OPEN_PAGE: {
            const { url } = data;
            await tabs.openPage(url);
            break;
        }

        case POPUP_MESSAGES.RELOAD: {
            const { tab } = data;
            await tabs.reload(tab);
            break;
        }

        case POPUP_MESSAGES.INIT_ASSISTANT: {
            const { tabId } = data;
            await tabs.initAssistant(tabId);
            break;
        }

        case CONTENT_MESSAGES.ADD_RULE: {
            const { ruleText } = data;
            await state.addRule(ruleText);
            break;
        }

        // TODO: send message if popup was closed
        // TODO: check word in Firefox
        case POPUP_MESSAGES.TEMPORARILY_DISABLE_FILTERING: {
            const { url, timeout, tab } = data;
            await state.temporarilyDisableFiltering(url, timeout);
            await tabs.reload(tab);
            setTimeout(() => {
                tabs.reload(tab);
            }, parseInt(timeout, 10) * 1000);
            break;
        }

        default: {
            throw new Error(`Unknown message type was sent: ${type}`);
        }
    }

    return Promise.resolve();
};

export default messageHandler;

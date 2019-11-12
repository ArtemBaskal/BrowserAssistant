import { RequestTypes, AssistantTypes } from '../lib/types';
import api from './Api';
import versions from './versions';

class RequestsApi {
    init(assistantType = AssistantTypes.nativeAssistant) {
        return api.makeRequest({
            type: RequestTypes.init,
            parameters: {
                ...versions,
                type: assistantType,
            },
        });
    }

    getCurrentAppState() {
        return api.makeRequest({
            type: RequestTypes.getCurrentAppState,
        });
    }

    getCurrentFilteringState(url) {
        return api.makeRequest({
            type: RequestTypes.getCurrentFilteringState,
            parameters: {
                url,
            },
        });
    }

    setProtectionStatus(isEnabled) {
        return api.makeRequest({
            type: RequestTypes.setProtectionStatus,
            parameters: {
                isEnabled,
            },
        });
    }

    /**
     * @param {object} parameters
     * @param {boolean} parameters.isEnabled
     * @param {boolean} parameters.isHttpsEnabled
     * @param {string} parameters.url
     * @returns {function}
     */
    setFilteringStatus(parameters) {
        return api.makeRequest({
            type: RequestTypes.setFilteringStatus,
            parameters,
        });
    }

    addRule(ruleText) {
        return api.makeRequest({
            type: RequestTypes.addRule,
            parameters: { ruleText },
        });
    }

    removeRule(ruleText) {
        return api.makeRequest({
            type: RequestTypes.removeRule,
            parameters: { ruleText },
        });
    }

    removeCustomRules(url) {
        return api.makeRequest({
            type: RequestTypes.removeCustomRules,
            parameters: { url },
        });
    }


    openOriginCert(domain) {
        return api.makeRequest({
            type: RequestTypes.openOriginCert,
            parameters: { domain },
        });
    }

    /**
     * @param {object} params
     * @param {string} params.url
     * @param {string} params.referrer
     * @returns {function}
     */
    reportSite(params) {
        return api.makeRequest({
            type: RequestTypes.reportSite,
            parameters: { ...params, userAgent: versions.userAgent },
        });
    }

    openFilteringLog() {
        return api.makeRequest({
            type: RequestTypes.openFilteringLog,
        });
    }

    openSettings() {
        return api.makeRequest({
            type: RequestTypes.openSettings,
        });
    }

    startApp() {
        return api.makeRequest({
            type: RequestTypes.startApp,
        });
    }
}

const requests = new RequestsApi();

export default requests;

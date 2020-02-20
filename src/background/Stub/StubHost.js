/**
 * Stub for the native application API.
 * It is used for debugging purposes only.
 */

import nanoid from 'nanoid';
import { ORIGINAL_CERT_STATUS } from '../../popup/stores/consts';
import {
    HostRequestTypes, HostResponseTypes, RequestTypes, ResponseTypesPrefixes,
} from '../../lib/types';
import log from '../../lib/logger';
import browserApi from '../browserApi';
import versions from '../versions';

class StubHost {
    delay = 500;

    REPORT_URL = 'https://reports.adguard.com/ru/new_issue.html?product_type=Win&pr...';

    filteringStatus = {
        /** @param isFilteringEnabled boolean * */
        isFilteringEnabled: true,
        /** @param isHttpsFilteringEnabled boolean * */
        isHttpsFilteringEnabled: true,
        /** @param isPageFilteredByUserFilter boolean * */
        isPageFilteredByUserFilter: false,
        /** @param blockedAdsCount number * */
        blockedAdsCount: 0,
        /** @param totalBlockedCount number * */
        totalBlockedCount: 346,
        /** @param originalCertIssuer string * */
        originalCertIssuer: 'GTS CA 1O1',
        /** @param originalCertStatus  {("valid" | "invalid" | "bypassed" | "notfound")}* */
        originalCertStatus: ORIGINAL_CERT_STATUS.VALID,
    };

    appState = {
        /** @param lastCheckTime string * */
        lastCheckTime: new Date().toISOString(),
        /** @param isInstalled boolean * */
        isInstalled: true,
        /** @param isRunning boolean * */
        isRunning: true,
        /** @param isProtectionEnabled boolean* */
        isProtectionEnabled: true,
    };

    set isFilteringEnabled(isFilteringEnabled) {
        this.filteringStatus.isFilteringEnabled = isFilteringEnabled;
        this.#makeRequest();
    }

    set isHttpsFilteringEnabled(isHttpsFilteringEnabled) {
        this.filteringStatus.isHttpsFilteringEnabled = isHttpsFilteringEnabled;
        this.#makeRequest();
    }

    set isPageFilteredByUserFilter(isPageFilteredByUserFilter) {
        this.filteringStatus.isPageFilteredByUserFilter = isPageFilteredByUserFilter;
        this.#makeRequest();
    }

    set blockedAdsCount(blockedAdsCount) {
        this.filteringStatus.blockedAdsCount = blockedAdsCount;
        this.#makeRequest();
    }

    set totalBlockedCount(totalBlockedCount) {
        this.filteringStatus.totalBlockedCount = totalBlockedCount;
        this.#makeRequest();
    }

    set originalCertIssuer(originalCertIssuer) {
        this.filteringStatus.originalCertIssuer = originalCertIssuer;
        this.#makeRequest();
    }

    set originalCertStatus(originalCertStatus) {
        this.filteringStatus.originalCertStatus = originalCertStatus;
        this.#makeRequest();
    }

    set lastCheckTime(lastCheckTime) {
        this.appState.lastCheckTime = lastCheckTime;
        this.#makeRequest();
    }

    set isInstalled(isInstalled) {
        this.appState.isInstalled = isInstalled;
        this.#makeRequest();
    }

    set isRunning(isRunning) {
        this.appState.isRunning = isRunning;
        this.#makeRequest();
    }

    set isProtectionEnabled(isProtectionEnabled) {
        this.appState.isProtectionEnabled = isProtectionEnabled;
        this.#makeRequest();
    }

    #makeRequest = async (delay) => {
        const request = {
            id: `ADG_APP_STATE_RESPONSE_MESSAGE_${nanoid()}`,
            type: HostRequestTypes.hostRequest,
            parameters: this.filteringStatus,
        };
        const response = await this.getStubResponse(request, delay);
        return this.#initHandler(response);
    };

    #initHandler = (response) => {
        log.info(`response ${response.id}`, response);
        const { parameters } = response;

        // Ignore requests without identifying prefix ADG
        if (!response.requestId.startsWith(ResponseTypesPrefixes.ADG)) {
            return;
        }

        if (parameters && response.requestId.startsWith(ResponseTypesPrefixes.ADG_INIT)) {
            this.isAppUpToDate = (versions.apiVersion <= parameters.apiVersion);
            adguard.isAppUpToDate = this.isAppUpToDate;

            this.isExtensionUpdated = parameters.isValidatedOnHost;
            adguard.isExtensionUpdated = this.isExtensionUpdated;
        }

        browserApi.runtime.sendMessage(response);
    };

    /**
     * @param delay
     * @returns {Promise<void>}
     */
   #waitDelay = async (delay = this.delay) => {
       return new Promise((resolve) => (setTimeout(resolve, delay)));
   };

    /**
     * Emulates server response with delay
     * @param request object
     * @param delay [number]
     * @returns {Promise<object>}
     */
    getStubResponse = async (request, delay) => {
        const { id, type, parameters } = request;
        const response = {
            id: `${id}_resp`,
            requestId: id,
            /** @param lastCheckTime {("ok" | "error")} * */
            result: HostResponseTypes.ok,
            appState: this.appState,
            timestamp: new Date().toISOString(),
            data: null,
            parameters,
        };

        await this.#waitDelay(delay);

        switch (type) {
            case RequestTypes.init:
                log.info('INIT');

                response.parameters = {
                    /** @param version string* */
                    version: '7.3.3050.0',
                    /** @param apiVersion string* */
                    apiVersion: '1',
                    /** @param isValidatedOnHost boolean* */
                    isValidatedOnHost: true,
                };
                break;
            case RequestTypes.getCurrentFilteringState:
                log.info('GET CURRENT FILTERING STATE');

                response.parameters = this.filteringStatus;
                if (parameters.forceStartApp) {
                    this.appState.isRunning = true;
                    this.appState.isProtectionEnabled = true;

                    response.appState = this.appState;
                }
                break;
            case RequestTypes.setProtectionStatus:
                log.info('SET PROTECTION STATUS');

                this.appState.isProtectionEnabled = parameters.isEnabled;
                response.appState = this.appState;
                break;
            case RequestTypes.setFilteringStatus:
                log.info('SET FILTERING STATUS');

                this.filteringStatus.isFilteringEnabled = parameters.isEnabled;
                this.filteringStatus.isHttpsFilteringEnabled = parameters.isHttpsEnabled;
                break;
            case RequestTypes.addRule:
                log.info('ADD RULE');
                break;
            case RequestTypes.removeRule:
                log.info('REMOVE RULE');
                break;
            case RequestTypes.removeCustomRules:
                log.info('REMOVE CUSTOM RULES');

                this.filteringStatus.isFilteringEnabled = true;
                this.filteringStatus.isHttpsFilteringEnabled = true;
                this.filteringStatus.isPageFilteredByUserFilter = false;
                break;
            case RequestTypes.openOriginalCert:
                log.info('OPEN ORIGINAL CERT');
                break;
            case RequestTypes.reportSite:
                response.parameters.reportUrl = this.REPORT_URL;
                log.info('REPORT SITE');
                break;
            case RequestTypes.openFilteringLog:
                log.info('OPEN FILTERING LOG');
                break;
            case RequestTypes.openSettings:
                log.info('OPEN SETTINGS');
                break;
            case RequestTypes.updateApp:
                log.info('UPDATE APP');
                break;
            case HostRequestTypes.hostRequest:
                log.info('HOST REQUEST');
                break;
            default:
                break;
        }
        return response;
    };
}

const stubHost = new StubHost();
window.stubHost = stubHost;

export default stubHost;

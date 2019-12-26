import React, { useEffect, useContext } from 'react';
import Modal from 'react-modal';
import browser from 'webextension-polyfill';
import { observer } from 'mobx-react';
import Settings from '../Settings';
import Options from '../Options';
import CurrentSite from '../CurrentSite';
import AppClosed from './AppClosed';
import AppWrapper from './AppWrapper';
import rootStore from '../../stores';
import { BACKGROUND_COMMANDS, HostResponseTypes } from '../../../lib/types';
import Loading from '../ui/Loading';

Modal.setAppElement('#root');

const App = observer(() => {
    const { settingsStore, uiStore, requestsStore } = useContext(rootStore);
    const {
        setCurrentFilteringState,
        setCurrentAppState,
        getCurrentTabHostname, getReferrer,
    } = settingsStore;

    useEffect(() => {
        (async () => {
            await getCurrentTabHostname();
            await getReferrer();
            await requestsStore.getCurrentFilteringState();
        })();

        browser.runtime.onMessage.addListener(
            (response) => {
                const {
                    parameters, appState, requestId, result,
                } = response;

                switch (result) {
                    case BACKGROUND_COMMANDS.SHOW_SETUP_INCORRECTLY:
                        settingsStore.setSetupCorrectly(false);
                        uiStore.setExtensionReloading(false);
                        break;
                    case BACKGROUND_COMMANDS.CLOSE_POPUP:
                        window.close();
                        break;
                    case BACKGROUND_COMMANDS.SHOW_RELOAD:
                        uiStore.setExtensionReloading(true);
                        break;
                    case HostResponseTypes.ok:
                        uiStore.setExtensionReloading(false);
                        break;
                    default:
                        break;
                }

                if (!requestId) {
                    return;
                }

                if (parameters && parameters.originalCertStatus) {
                    setCurrentFilteringState(parameters);
                }

                setCurrentAppState(appState);
            }
        );

        return () => {
            browser.runtime.onMessage.removeListener();
        };
    }, []);

    if (uiStore.requestStatus.isError) {
        return (
            <AppWrapper>
                <AppClosed />
            </AppWrapper>
        );
    }

    if (uiStore.requestStatus.isPending) {
        return (<Loading title="Preparing..." />);
    }

    if (uiStore.requestStatus.isSuccess) {
        return (
            <AppWrapper>
                <CurrentSite />
                <Settings />
                <Options />
            </AppWrapper>
        );
    }

    return (<Loading />);
});

export default App;

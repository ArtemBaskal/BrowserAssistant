import { action, computed, observable } from 'mobx';
import { createIntl } from 'react-intl';
import { browserLocale } from '../../../lib/consts';
import messagesMap from '../../../_locales';

const { BASE_LOCALE } = require('../../../../tasks/langConstants');

class TranslationStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @observable locale = null;

    @action
    setLocale = (locale) => {
        this.locale = locale || BASE_LOCALE;
    };

    getLocale = () => {
        return this.locale || this.getFallbackLocale();
    };

    getFallbackLocale = () => {
        return messagesMap[browserLocale] ? browserLocale : BASE_LOCALE;
    };

    @computed
    get i18n() {
        const fallbackLocale = this.getFallbackLocale();
        const locale = messagesMap[this.locale] ? this.locale : fallbackLocale;

        const messages = {
            ...messagesMap[BASE_LOCALE],
            ...messagesMap[locale],
        };

        return createIntl({
            locale,
            messages,
        });
    }

    translate = (id) => this.i18n.formatMessage({ id });
}

export default TranslationStore;

import template from './laenen-product-select-settings.html.twig';

const CONFIG_KEY = 'LaenenExtendedProductSelect.config.fieldConfig';

export default {
    template,

    inject: ['systemConfigApiService'],

    data() {
        return {
            isLoading: false,
            isSaveSuccessful: false,
            fieldConfigJson: null,
        };
    },

    created() {
        this.loadConfig();
    },

    methods: {
        async loadConfig() {
            this.isLoading = true;
            try {
                const config = await this.systemConfigApiService.getValues(
                    'LaenenExtendedProductSelect.config',
                );
                this.fieldConfigJson = config[CONFIG_KEY] ?? null;
            } finally {
                this.isLoading = false;
            }
        },

        async saveConfig() {
            this.isLoading = true;
            this.isSaveSuccessful = false;
            try {
                await this.systemConfigApiService.saveValues({
                    [CONFIG_KEY]: this.fieldConfigJson,
                });
                this.isSaveSuccessful = true;
            } finally {
                this.isLoading = false;
            }
        },

        onFieldConfigChange(value) {
            this.fieldConfigJson = value;
        },

        onSaveFinish() {
            this.isSaveSuccessful = false;
        },
    },
};

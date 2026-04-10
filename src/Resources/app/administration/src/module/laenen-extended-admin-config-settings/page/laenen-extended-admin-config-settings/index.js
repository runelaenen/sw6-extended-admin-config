import template from './laenen-extended-admin-config-settings.html.twig';

const FIELD_CONFIG_KEY = 'LaenenExtendedAdminConfig.config.fieldConfig';
const ORDER_COLUMNS_KEY = 'LaenenExtendedAdminConfig.config.orderListColumns';
const CUSTOMER_COLUMNS_KEY = 'LaenenExtendedAdminConfig.config.customerListColumns';

export default {
    template,

    inject: ['systemConfigApiService'],

    data() {
        return {
            isLoading: false,
            isSaveSuccessful: false,
            fieldConfigJson: null,
            orderColumnConfigJson: null,
            customerColumnConfigJson: null,
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
                    'LaenenExtendedAdminConfig.config',
                );
                this.fieldConfigJson = config[FIELD_CONFIG_KEY] ?? null;
                this.orderColumnConfigJson = config[ORDER_COLUMNS_KEY] ?? null;
                this.customerColumnConfigJson = config[CUSTOMER_COLUMNS_KEY] ?? null;
            } finally {
                this.isLoading = false;
            }
        },

        async saveConfig() {
            this.isLoading = true;
            this.isSaveSuccessful = false;
            try {
                await this.systemConfigApiService.saveValues({
                    [FIELD_CONFIG_KEY]: this.fieldConfigJson,
                    [ORDER_COLUMNS_KEY]: this.orderColumnConfigJson,
                    [CUSTOMER_COLUMNS_KEY]: this.customerColumnConfigJson,
                });
                this.isSaveSuccessful = true;
            } finally {
                this.isLoading = false;
            }
        },

        onFieldConfigChange(value) {
            this.fieldConfigJson = value;
        },

        onOrderColumnConfigChange(value) {
            this.orderColumnConfigJson = value;
        },

        onCustomerColumnConfigChange(value) {
            this.customerColumnConfigJson = value;
        },

        onSaveFinish() {
            this.isSaveSuccessful = false;
        },
    },
};

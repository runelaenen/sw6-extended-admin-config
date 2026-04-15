import template from './laenen-extended-admin-config-settings.html.twig';
import './laenen-extended-admin-config-settings.scss';

const FIELD_CONFIG_KEY = 'LaenenExtendedAdminConfig.config.fieldConfig';
const ORDER_COLUMNS_KEY = 'LaenenExtendedAdminConfig.config.orderListColumns';
const CUSTOMER_COLUMNS_KEY = 'LaenenExtendedAdminConfig.config.customerListColumns';
const NEW_ORDER_LINE_ITEM_COLUMNS_KEY = 'LaenenExtendedAdminConfig.config.newOrderLineItemColumns';
const ORDER_FILTERS_KEY = 'LaenenExtendedAdminConfig.config.orderListFilters';
const CUSTOMER_FILTERS_KEY = 'LaenenExtendedAdminConfig.config.customerListFilters';

export default {
    template,

    inject: ['systemConfigApiService'],

    data() {
        return {
            isLoading: false,
            isSaveSuccessful: false,
            currentTab: 'order-list',
            fieldConfigJson: null,
            orderColumnConfigJson: null,
            customerColumnConfigJson: null,
            newOrderLineItemColumnConfigJson: null,
            orderFilterConfigJson: null,
            customerFilterConfigJson: null,
        };
    },

    computed: {
        tabItems() {
            return [
                { label: this.$tc('laenen-extended-admin-config-settings.page.tabOrderList'), name: 'order-list' },
                { label: this.$tc('laenen-extended-admin-config-settings.page.tabOrderCreation'), name: 'order-creation' },
                { label: this.$tc('laenen-extended-admin-config-settings.page.tabCustomerList'), name: 'customer-list' },
            ];
        },
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
                this.newOrderLineItemColumnConfigJson = config[NEW_ORDER_LINE_ITEM_COLUMNS_KEY] ?? null;
                this.orderFilterConfigJson = config[ORDER_FILTERS_KEY] ?? null;
                this.customerFilterConfigJson = config[CUSTOMER_FILTERS_KEY] ?? null;
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
                    [NEW_ORDER_LINE_ITEM_COLUMNS_KEY]: this.newOrderLineItemColumnConfigJson,
                    [ORDER_FILTERS_KEY]: this.orderFilterConfigJson,
                    [CUSTOMER_FILTERS_KEY]: this.customerFilterConfigJson,
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

        onNewOrderLineItemColumnConfigChange(value) {
            this.newOrderLineItemColumnConfigJson = value;
        },

        onOrderFilterConfigChange(value) {
            this.orderFilterConfigJson = value;
        },

        onCustomerFilterConfigChange(value) {
            this.customerFilterConfigJson = value;
        },

        onSaveFinish() {
            this.isSaveSuccessful = false;
        },
    },
};

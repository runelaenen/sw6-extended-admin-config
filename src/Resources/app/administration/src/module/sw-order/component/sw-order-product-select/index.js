import template from './sw-order-product-select.html.twig';
import { buildAssociationPath } from '../../../../utils/build-association-path.js';

const DEFAULT_FIELD_CONFIG = [
    { path: 'translated.name', format: null },
    { path: 'manufacturer.translated.name', format: null },
    { path: 'stock', format: null },
    { path: 'price.0.gross', format: 'currency' },
];

export default {
    template,

    inject: ['systemConfigApiService'],

    data() {
        return {
            fieldConfig: DEFAULT_FIELD_CONFIG.map(f => ({ ...f })),
        };
    },

    created() {
        this.loadFieldConfig();
    },

    computed: {
        productCriteria() {
            const criteria = this.$super('productCriteria');

            this.fieldConfig
                .filter(field => field.path)
                .forEach(field => {
                    const assocPath = buildAssociationPath('product', field.path.split('.'));
                    if (assocPath.length > 0) {
                        criteria.addAssociation(assocPath.join('.'));
                    }
                });

            return criteria;
        },

        currencyFilter() {
            return Shopware.Filter.getByName('currency');
        },
    },

    methods: {
        async loadFieldConfig() {
            try {
                const config = await this.systemConfigApiService.getValues('LaenenExtendedAdminConfig.config');
                const raw = config['LaenenExtendedAdminConfig.config.fieldConfig'];

                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this.fieldConfig = parsed;
                    }
                }
            } catch (e) {
                console.warn('[LaenenExtendedAdminConfig] Could not load field config:', e);
            }
        },

        resolveFieldPath(item, path) {
            if (!path) return null;
            return path.split('.').reduce((obj, key) => {
                if (obj === null || obj === undefined) return null;
                const val = obj[key];
                return val !== undefined ? val : null;
            }, item);
        },

        getProductLabel(item) {
            const currencyISOCode = Shopware.Context.app.systemCurrencyISOCode;

            const parts = this.fieldConfig
                .map(field => {
                    const value = this.resolveFieldPath(item, field.path);

                    if (value === null || value === undefined) return null;

                    if (field.format === 'currency') {
                        return this.currencyFilter(value, currencyISOCode);
                    }

                    return String(value);
                })
                .filter(part => part !== null && part !== undefined && part !== '');

            return parts.join(' | ');
        },
    },
};

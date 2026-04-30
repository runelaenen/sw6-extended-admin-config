import template from './sw-order-line-items-grid.html.twig';
import { buildAssociationPath } from '../../../../utils/build-association-path.js';

const FIELD_CONFIG_KEY = 'LaenenExtendedAdminConfig.config.fieldConfig';

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
            productDataMap: {},
            fieldConfig: DEFAULT_FIELD_CONFIG.map(f => ({ ...f })),
        };
    },

    watch: {
        'order.lineItems'() {
            this.enrichLineItemsWithProductData();
        },

        fieldConfig() {
            this.enrichLineItemsWithProductData();
        },
    },

    created() {
        this.loadFieldConfig();
    },

    computed: {
        productRepository() {
            return Shopware.Service('repositoryFactory').create('product');
        },
    },

    methods: {
        async loadFieldConfig() {
            try {
                const config = await this.systemConfigApiService.getValues('LaenenExtendedAdminConfig.config');
                const rawFields = config[FIELD_CONFIG_KEY];
                if (rawFields) {
                    const parsed = JSON.parse(rawFields);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this.fieldConfig = parsed;
                    }
                }
            } catch (e) {
                console.warn('[LaenenExtendedAdminConfig] Could not load field config:', e);
            }

            this.enrichLineItemsWithProductData();
        },

        async enrichLineItemsWithProductData() {
            const productItems = this.order.lineItems.filter(
                item => item.type === 'product' && item.productId,
            );
            if (productItems.length === 0 || this.fieldConfig.length === 0) return;

            const idsToFetch = [...new Set(
                productItems
                    .filter(item => !this.productDataMap[item.productId])
                    .map(item => item.productId),
            )];

            if (idsToFetch.length === 0) return;

            const { Criteria } = Shopware.Data;
            const criteria = new Criteria(1, idsToFetch.length);
            criteria.setIds(idsToFetch);

            this.fieldConfig
                .filter(field => field.path)
                .forEach(field => {
                    const assocPath = buildAssociationPath('product', field.path.split('.'));
                    if (assocPath.length > 0) {
                        criteria.addAssociation(assocPath.join('.'));
                    }
                });

            try {
                const result = await this.productRepository.search(criteria, Shopware.Context.api);
                result.forEach(product => {
                    this.productDataMap[product.id] = product;
                });
            } catch (e) {
                console.warn('[LaenenExtendedAdminConfig] Could not enrich line item payload:', e);
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

        getLineItemProductTooltip(item) {
            if (!item || !item.productId) return '';
            const product = this.productDataMap[item.productId];
            if (!product) return '';

            const currencyISOCode = Shopware.Context.app.systemCurrencyISOCode;

            const parts = this.fieldConfig
                .map(field => {
                    const value = this.resolveFieldPath(product, field.path);
                    if (value === null || value === undefined) return null;

                    if (field.format === 'currency') {
                        return this.currencyFilter(value, currencyISOCode);
                    }

                    return String(value);
                })
                .filter(part => part !== null && part !== '');

            return parts.join(' | ');
        },
    },
};

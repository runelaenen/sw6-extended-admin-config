import template from './sw-order-line-items-grid-sales-channel.html.twig';
import { buildAssociationPath } from '../../../../utils/build-association-path.js';

const NEW_ORDER_LINE_ITEM_COLUMNS_KEY = 'LaenenExtendedAdminConfig.config.newOrderLineItemColumns';
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
            extraLineItemColumns: [],
            productDataMap: {},
            fieldConfig: DEFAULT_FIELD_CONFIG.map(f => ({ ...f })),
        };
    },

    watch: {
        cartLineItems() {
            this.enrichLineItemsWithProductData();
        },

        extraLineItemColumns() {
            this.enrichLineItemsWithProductData();
        },

        fieldConfig() {
            this.enrichLineItemsWithProductData();
        },
    },

    created() {
        this.loadLineItemColumnConfig();
    },

    computed: {
        productRepository() {
            return Shopware.Service('repositoryFactory').create('product');
        },

        currencyFilter() {
            return Shopware.Filter.getByName('currency');
        },

        getLineItemColumns() {
            const columns = this.$super('getLineItemColumns');
            columns.forEach(col => { col.allowResize = true; });
            const toAppend = [];
            const toInsert = [];

            this.extraLineItemColumns
                .filter(column => column.active && column.path)
                .forEach(column => {
                    const colDef = {
                        property: column.path,
                        dataIndex: column.path,
                        label: column.label || column.path,
                        allowResize: true,
                        visible: true,
                        sortable: false,
                        width: '150px',
                    };

                    if (column.afterColumn) {
                        const idx = columns.findIndex(c => c.property === column.afterColumn);
                        if (idx !== -1) {
                            toInsert.push({ afterIndex: idx, colDef });
                            return;
                        }
                    }
                    toAppend.push(colDef);
                });

            toInsert.sort((a, b) => a.afterIndex - b.afterIndex);
            for (let i = toInsert.length - 1; i >= 0; i--) {
                columns.splice(toInsert[i].afterIndex + 1, 0, toInsert[i].colDef);
            }
            toAppend.forEach(col => columns.push(col));

            return columns;
        },
    },

    methods: {
        async loadLineItemColumnConfig() {
            try {
                const config = await this.systemConfigApiService.getValues('LaenenExtendedAdminConfig.config');
                const raw = config[NEW_ORDER_LINE_ITEM_COLUMNS_KEY];
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        this.extraLineItemColumns = parsed;
                    }
                }

                const rawFields = config[FIELD_CONFIG_KEY];
                if (rawFields) {
                    const parsed = JSON.parse(rawFields);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this.fieldConfig = parsed;
                    }
                }
            } catch (e) {
                console.warn('[LaenenExtendedAdminConfig] Could not load new order line item column config:', e);
            }
        },

        async enrichLineItemsWithProductData() {
            const productItems = this.cartLineItems.filter(
                item => item.type === 'product' && item.referencedId,
            );
            if (productItems.length === 0) return;

            // Collect all payload keys from configured columns, split into association vs direct fields
            const allPayloadKeys = new Set();
            const associationKeys = new Set();

            this.extraLineItemColumns
                .filter(col => col.active && col.path?.startsWith('payload.'))
                .forEach(col => {
                    const firstKey = col.path.slice('payload.'.length).split('.')[0];
                    allPayloadKeys.add(firstKey);
                    if (buildAssociationPath('product', [firstKey]).length > 0) {
                        associationKeys.add(firstKey);
                    }
                });

            if (allPayloadKeys.size === 0 && this.fieldConfig.length === 0) return;

            // Fetch products not yet in the local cache
            const idsToFetch = [...new Set(
                productItems
                    .filter(item => !this.productDataMap[item.referencedId])
                    .map(item => item.referencedId),
            )];

            if (idsToFetch.length > 0) {
                const { Criteria } = Shopware.Data;
                const criteria = new Criteria(1, idsToFetch.length);
                criteria.setIds(idsToFetch);
                associationKeys.forEach(key => criteria.addAssociation(key));

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
                    return;
                }
            }

            // Merge all configured payload keys (both associations and direct fields) into item.payload
            productItems.forEach(item => {
                const product = this.productDataMap[item.referencedId];
                if (!product) return;

                if (!item.payload) item.payload = {};
                allPayloadKeys.forEach(key => {
                    if (product[key] != null) {
                        item.payload[key] = product[key];
                    }
                });
            });
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
            if (!item || !item.referencedId) return '';
            const product = this.productDataMap[item.referencedId];
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

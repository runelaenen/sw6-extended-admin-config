import { buildAssociationPath } from '../../../../utils/build-association-path.js';

const NEW_ORDER_LINE_ITEM_COLUMNS_KEY = 'LaenenExtendedAdminConfig.config.newOrderLineItemColumns';

export default {
    inject: ['systemConfigApiService'],

    data() {
        return {
            extraLineItemColumns: [],
            productDataMap: {},
        };
    },

    watch: {
        cartLineItems() {
            this.enrichLineItemsWithProductData();
        },

        extraLineItemColumns() {
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

        getLineItemColumns() {
            const columns = this.$super('getLineItemColumns');
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
            } catch (e) {
                console.warn('[LaenenExtendedAdminConfig] Could not load new order line item column config:', e);
            }
        },

        async enrichLineItemsWithProductData() {
            const productItems = this.cartLineItems.filter(
                item => item.type === 'product' && item.referencedId,
            );
            if (productItems.length === 0) return;

            // Determine which top-level payload keys need association loading
            const keysToEnrich = new Set();
            this.extraLineItemColumns
                .filter(col => col.active && col.path?.startsWith('payload.'))
                .forEach(col => {
                    const firstKey = col.path.slice('payload.'.length).split('.')[0];
                    if (buildAssociationPath('product', [firstKey]).length > 0) {
                        keysToEnrich.add(firstKey);
                    }
                });

            if (keysToEnrich.size === 0) return;

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
                keysToEnrich.forEach(key => criteria.addAssociation(key));

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

            // Merge extra data into each item's payload (also applies cache hits)
            productItems.forEach(item => {
                const product = this.productDataMap[item.referencedId];
                if (!product) return;

                if (!item.payload) item.payload = {};
                keysToEnrich.forEach(key => {
                    if (product[key] != null) {
                        item.payload[key] = product[key];
                    }
                });
            });
        },
    },
};

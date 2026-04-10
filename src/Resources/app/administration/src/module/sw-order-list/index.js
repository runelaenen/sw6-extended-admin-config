import { buildAssociationPath } from '../../utils/build-association-path.js';

const ORDER_COLUMNS_KEY = 'LaenenExtendedAdminConfig.config.orderListColumns';

// On the order entity, billingAddress nested associations should be loaded
// through the addresses collection rather than the billingAddress association.
const ORDER_ASSOCIATION_MAP = {
    billingAddress: 'addresses',
};

Shopware.Component.override('sw-order-list', {
    inject: ['systemConfigApiService'],

    data() {
        return {
            extraOrderColumns: [],
        };
    },

    computed: {
        orderCriteria() {
            const criteria = this.$super('orderCriteria');

            this.extraOrderColumns
                .filter(column => column.active && column.path)
                .forEach(column => {
                    let assocPath = buildAssociationPath('order', column.path.split('.'));
                    if (assocPath.length === 0) return;

                    if (ORDER_ASSOCIATION_MAP[assocPath[0]]) {
                        assocPath = [ORDER_ASSOCIATION_MAP[assocPath[0]], ...assocPath.slice(1)];
                    }

                    criteria.addAssociation(assocPath.join('.'));
                });

            return criteria;
        },
    },

    methods: {
        async createdComponent() {
            this.$super('createdComponent');
            await this.loadOrderColumnConfig();
        },

        async loadOrderColumnConfig() {
            try {
                const config = await this.systemConfigApiService.getValues(
                    'LaenenExtendedAdminConfig.config',
                );
                const raw = config[ORDER_COLUMNS_KEY];
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        this.extraOrderColumns = parsed;
                    }
                }
            } catch (e) {
                console.warn('[LaenenExtendedAdminConfig] Could not load order column config:', e);
            }
        },

        getOrderColumns() {
            const columns = this.$super('getOrderColumns');
            const toAppend = [];
            const toInsert = [];

            this.extraOrderColumns
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
});

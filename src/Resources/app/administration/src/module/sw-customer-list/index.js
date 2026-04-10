import { buildAssociationPath } from '../../utils/build-association-path.js';

const CUSTOMER_COLUMNS_KEY = 'LaenenExtendedAdminConfig.config.customerListColumns';

Shopware.Component.override('sw-customer-list', {
    inject: ['systemConfigApiService'],

    data() {
        return {
            extraCustomerColumns: [],
        };
    },

    computed: {
        defaultCriteria() {
            const criteria = this.$super('defaultCriteria');

            this.extraCustomerColumns
                .filter(column => column.active && column.path)
                .forEach(column => {
                    const assocPath = buildAssociationPath('customer', column.path.split('.'));
                    if (assocPath.length > 0) {
                        criteria.addAssociation(assocPath.join('.'));
                    }
                });

            return criteria;
        },
    },

    methods: {
        async createdComponent() {
            this.$super('createdComponent');
            await this.loadCustomerColumnConfig();
        },

        async loadCustomerColumnConfig() {
            try {
                const config = await this.systemConfigApiService.getValues(
                    'LaenenExtendedAdminConfig.config',
                );
                const raw = config[CUSTOMER_COLUMNS_KEY];
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        this.extraCustomerColumns = parsed;
                    }
                }
            } catch (e) {
                console.warn('[LaenenExtendedAdminConfig] Could not load customer column config:', e);
            }
        },

        getCustomerColumns() {
            const columns = this.$super('getCustomerColumns');
            const toAppend = [];
            const toInsert = [];

            this.extraCustomerColumns
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

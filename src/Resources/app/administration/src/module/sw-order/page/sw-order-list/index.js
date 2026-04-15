import template from './sw-order-list.html.twig';
import { buildAssociationPath } from '../../../../utils/build-association-path.js';

const ORDER_COLUMNS_KEY = 'LaenenExtendedAdminConfig.config.orderListColumns';
const ORDER_FILTERS_KEY = 'LaenenExtendedAdminConfig.config.orderListFilters';

const ORDER_ASSOCIATION_MAP = {
    billingAddress: 'addresses',
};

export default {
    template,

    inject: ['systemConfigApiService'],

    data() {
        return {
            extraOrderColumns: [],
            extraOrderFilters: [],
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

        listFilterOptions() {
            const options = this.$super('listFilterOptions');

            this.extraOrderFilters
                .filter(f => f.active && f.property)
                .forEach(f => {
                    const key = `laenen-filter-${f.property.replace(/[^a-z0-9]/gi, '-')}`;
                    options[key] = {
                        property: f.property,
                        label: f.label || f.property,
                        // type: 'string-filter',
                    };
                });

            return options;
        },
    },

    methods: {
        async createdComponent() {
            await this.loadOrderColumnConfig();
            this.$super('createdComponent');
        },

        async loadOrderColumnConfig() {
            try {
                const config = await this.systemConfigApiService.getValues(
                    'LaenenExtendedAdminConfig.config',
                );

                const rawColumns = config[ORDER_COLUMNS_KEY];
                if (rawColumns) {
                    const parsed = JSON.parse(rawColumns);
                    if (Array.isArray(parsed)) {
                        this.extraOrderColumns = parsed;
                    }
                }

                const rawFilters = config[ORDER_FILTERS_KEY];
                if (rawFilters) {
                    const parsed = JSON.parse(rawFilters);
                    if (Array.isArray(parsed)) {
                        this.extraOrderFilters = parsed;

                        const extraFilterKeys = parsed
                            .filter(f => f.active && f.property)
                            .map(f => `laenen-filter-${f.property.replace(/[^a-z0-9]/gi, '-')}`);

                        if (extraFilterKeys.length > 0) {
                            this.defaultFilters = [...this.defaultFilters, ...extraFilterKeys];
                        }
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
};

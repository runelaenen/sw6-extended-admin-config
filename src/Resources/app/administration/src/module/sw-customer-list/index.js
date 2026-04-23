import template from './sw-customer-list.html.twig';
import { buildAssociationPath } from '../../utils/build-association-path.js';

const CUSTOMER_COLUMNS_KEY = 'LaenenExtendedAdminConfig.config.customerListColumns';
const CUSTOMER_FILTERS_KEY = 'LaenenExtendedAdminConfig.config.customerListFilters';

Shopware.Component.override('sw-customer-list', {
    template,

    inject: ['systemConfigApiService', 'repositoryFactory'],

    data() {
        return {
            extraCustomerColumns: [],
            extraCustomerFilters: [],
            addressDataMap: {},
        };
    },

    watch: {
        customers() {
            this.enrichCustomersWithAddressData();
        },
    },

    computed: {
        customerAddressRepository() {
            return this.repositoryFactory.create('customer_address');
        },

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

        listFilterOptions() {
            const options = this.$super('listFilterOptions');

            this.extraCustomerFilters
                .filter(f => f.active && f.property)
                .forEach(f => {
                    const key = `laenen-filter-${f.property.replace(/[^a-z0-9]/gi, '-')}`;
                    options[key] = {
                        property: f.property,
                        label: f.label || f.property,
                        type: 'string-filter',
                    };
                });

            return options;
        },

        formattedExtraCustomerColumns() {
            return this.extraCustomerColumns
                .filter(col => col.active && col.path && col.format)
                .map(col => ({
                    ...col,
                    slotName: `column-${col.path}`,
                }));
        },

        currencyFilter() {
            return Shopware.Filter.getByName('currency');
        },

        dateFilter() {
            return Shopware.Filter.getByName('date');
        },
    },

    methods: {
        async createdComponent() {
            await this.loadCustomerColumnConfig();
            this.$super('createdComponent');
        },

        async loadCustomerColumnConfig() {
            try {
                const config = await this.systemConfigApiService.getValues(
                    'LaenenExtendedAdminConfig.config',
                );

                const rawColumns = config[CUSTOMER_COLUMNS_KEY];
                if (rawColumns) {
                    const parsed = JSON.parse(rawColumns);
                    if (Array.isArray(parsed)) {
                        this.extraCustomerColumns = parsed;
                    }
                }

                const rawFilters = config[CUSTOMER_FILTERS_KEY];
                if (rawFilters) {
                    const parsed = JSON.parse(rawFilters);
                    if (Array.isArray(parsed)) {
                        this.extraCustomerFilters = parsed;

                        const extraFilterKeys = parsed
                            .filter(f => f.active && f.property)
                            .map(f => `laenen-filter-${f.property.replace(/[^a-z0-9]/gi, '-')}`);

                        if (extraFilterKeys.length > 0) {
                            this.defaultFilters = [...this.defaultFilters, ...extraFilterKeys];
                        }
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

        resolveCustomerFieldPath(item, path) {
            if (!path) return null;
            return path.split('.').reduce((obj, key) => {
                if (obj === null || obj === undefined) return null;
                const val = obj[key];
                return val !== undefined ? val : null;
            }, item);
        },

        applyCustomerFormat(item, col) {
            const value = this.resolveCustomerFieldPath(item, col.path);
            if (value === null || value === undefined) return '';

            if (col.format === 'currency') {
                const isoCode = Shopware.Context.app.systemCurrencyISOCode;
                return this.currencyFilter(value, isoCode);
            }

            if (col.format === 'date') {
                return this.dateFilter(value);
            }

            return String(value);
        },

        async enrichCustomersWithAddressData() {
            if (!this.customers || this.customers.length === 0) return;

            // Determine which sub-associations of customer_address are needed
            const addressAssociations = new Set();
            this.extraCustomerColumns
                .filter(c => c.active && c.path)
                .forEach(c => {
                    const parts = c.path.split('.');
                    if (parts.length >= 2 &&
                        (parts[0] === 'defaultShippingAddress' || parts[0] === 'defaultBillingAddress')) {
                        const subAssocPath = buildAssociationPath('customer_address', parts.slice(1));
                        if (subAssocPath.length > 0) {
                            addressAssociations.add(subAssocPath.join('.'));
                        }
                    }
                });

            if (addressAssociations.size === 0) return;

            // Collect uncached address IDs that need fetching
            const uncachedIds = [];
            this.customers.forEach(customer => {
                if (customer.defaultShippingAddressId && !this.addressDataMap[customer.defaultShippingAddressId]) {
                    uncachedIds.push(customer.defaultShippingAddressId);
                }
                if (customer.defaultBillingAddressId && !this.addressDataMap[customer.defaultBillingAddressId]) {
                    uncachedIds.push(customer.defaultBillingAddressId);
                }
            });

            const uniqueUncachedIds = [...new Set(uncachedIds)];
            if (uniqueUncachedIds.length > 0) {
                try {
                    const criteria = new Shopware.Data.Criteria();
                    criteria.setIds(uniqueUncachedIds);
                    addressAssociations.forEach(assoc => criteria.addAssociation(assoc));

                    const addresses = await this.customerAddressRepository.search(criteria, Shopware.Context.api);
                    addresses.forEach(addr => {
                        this.addressDataMap[addr.id] = addr;
                    });
                } catch (e) {
                    console.warn('[LaenenExtendedAdminConfig] Could not enrich customer address data:', e);
                }
            }

            // Always inject from cache into the current customer entities
            this.customers.forEach(customer => {
                const shipping = this.addressDataMap[customer.defaultShippingAddressId];
                const billing = this.addressDataMap[customer.defaultBillingAddressId];
                if (shipping) customer.defaultShippingAddress = shipping;
                if (billing) customer.defaultBillingAddress = billing;
            });
        },
    },
});

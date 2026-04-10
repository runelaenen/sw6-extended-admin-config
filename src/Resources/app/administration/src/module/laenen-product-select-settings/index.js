Shopware.Component.register('laenen-product-select-settings', () => import('./page/laenen-product-select-settings'));
Shopware.Component.register('laenen-field-configurator', () => import('./component/laenen-field-configurator'));

Shopware.Module.register('laenen-product-select-settings', {
    type: 'plugin',
    name: 'laenen-product-select-settings.general.name',
    title: 'laenen-product-select-settings.general.title',
    description: 'laenen-product-select-settings.general.description',
    color: '#189EFF',
    icon: 'regular-products',

    routes: {
        index: {
            component: 'laenen-product-select-settings',
            path: 'index',
            meta: {
                parentPath: 'sw.settings.index',
            },
        },
    },

    settingsItem: {
        group: 'plugins',
        to: 'laenen.product.select.settings.index',
        icon: 'regular-products',
        backgroundEnabled: true,
    },
});

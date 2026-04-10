Shopware.Component.register('laenen-extended-admin-config-settings', () => import('./page/laenen-extended-admin-config-settings'));
Shopware.Component.register('laenen-field-configurator', () => import('./component/laenen-field-configurator'));
Shopware.Component.register('laenen-column-configurator', () => import('./component/laenen-column-configurator'));

Shopware.Module.register('laenen-extended-admin-config-settings', {
    type: 'plugin',
    name: 'laenen-extended-admin-config-settings.general.name',
    title: 'laenen-extended-admin-config-settings.general.title',
    description: 'laenen-extended-admin-config-settings.general.description',
    color: '#189EFF',
    icon: 'regular-cog',

    routes: {
        index: {
            component: 'laenen-extended-admin-config-settings',
            path: 'index',
            meta: {
                parentPath: 'sw.settings.index',
            },
        },
    },

    settingsItem: {
        group: 'plugins',
        to: 'laenen.extended.admin.config.settings.index',
        icon: 'regular-cog',
        backgroundEnabled: true,
    },
});

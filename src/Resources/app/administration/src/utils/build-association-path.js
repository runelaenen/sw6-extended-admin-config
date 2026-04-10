/**
 * Walks a dot-notation path against Shopware entity definitions and returns the
 * leading segments that are association fields.
 *
 * Example: buildAssociationPath('order', ['billingAddress', 'countryState', 'name'])
 *          → ['billingAddress', 'countryState']
 *
 * The returned array can be joined with '.' and passed directly to
 * criteria.addAssociation(), which handles dot-notation nesting automatically.
 *
 * @param {string} startEntityName - Shopware entity name, e.g. 'order', 'product'
 * @param {string[]} segments      - Path segments split on '.'
 * @returns {string[]}             - Association segments (may be empty)
 */
export function buildAssociationPath(startEntityName, segments) {
    const assocSegments = [];
    let entityName = startEntityName;

    for (const segment of segments) {
        const definition = Shopware.EntityDefinition.get(entityName);
        if (!definition) break;

        const assocFields = definition.getAssociationFields();
        if (!Object.prototype.hasOwnProperty.call(assocFields, segment)) break;

        assocSegments.push(segment);
        entityName = assocFields[segment].entity;
        if (!entityName) break;
    }

    return assocSegments;
}

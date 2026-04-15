import template from './laenen-filter-configurator.html.twig';

export default {
    template,

    props: {
        value: {
            required: false,
            default: null,
        },
    },

    data() {
        return {
            filterList: this.parseValue(this.value),
        };
    },

    watch: {
        value(newValue) {
            this.filterList = this.parseValue(newValue);
        },
    },

    methods: {
        parseValue(value) {
            if (!value) {
                return [];
            }
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch (e) {
                // invalid JSON — fall back to empty list
            }
            return [];
        },

        emitChange() {
            this.$emit('update:value', JSON.stringify(this.filterList));
        },

        addFilter() {
            this.filterList.push({ property: '', label: '', active: true });
            this.emitChange();
        },

        removeFilter(index) {
            this.filterList.splice(index, 1);
            this.emitChange();
        },

        moveUp(index) {
            if (index === 0) return;
            const item = this.filterList.splice(index, 1)[0];
            this.filterList.splice(index - 1, 0, item);
            this.emitChange();
        },

        moveDown(index) {
            if (index >= this.filterList.length - 1) return;
            const item = this.filterList.splice(index, 1)[0];
            this.filterList.splice(index + 1, 0, item);
            this.emitChange();
        },

        onPropertyChange(index, value) {
            this.filterList[index].property = value;
            this.emitChange();
        },

        onLabelChange(index, value) {
            this.filterList[index].label = value;
            this.emitChange();
        },

        onActiveChange(index, checked) {
            this.filterList[index].active = checked;
            this.emitChange();
        },
    },
};

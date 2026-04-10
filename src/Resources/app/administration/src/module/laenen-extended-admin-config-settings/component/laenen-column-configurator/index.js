import template from './laenen-column-configurator.html.twig';

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
            columnList: this.parseValue(this.value),
        };
    },

    watch: {
        value(newValue) {
            this.columnList = this.parseValue(newValue);
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
            this.$emit('update:value', JSON.stringify(this.columnList));
        },

        addColumn() {
            this.columnList.push({ path: '', label: '', active: true, afterColumn: '' });
            this.emitChange();
        },

        removeColumn(index) {
            this.columnList.splice(index, 1);
            this.emitChange();
        },

        moveUp(index) {
            if (index === 0) return;
            const item = this.columnList.splice(index, 1)[0];
            this.columnList.splice(index - 1, 0, item);
            this.emitChange();
        },

        moveDown(index) {
            if (index >= this.columnList.length - 1) return;
            const item = this.columnList.splice(index, 1)[0];
            this.columnList.splice(index + 1, 0, item);
            this.emitChange();
        },

        onPathChange(index, value) {
            this.columnList[index].path = value;
            this.emitChange();
        },

        onLabelChange(index, value) {
            this.columnList[index].label = value;
            this.emitChange();
        },

        onActiveChange(index, checked) {
            this.columnList[index].active = checked;
            this.emitChange();
        },

        onAfterColumnChange(index, value) {
            this.columnList[index].afterColumn = value || '';
            this.emitChange();
        },
    },
};

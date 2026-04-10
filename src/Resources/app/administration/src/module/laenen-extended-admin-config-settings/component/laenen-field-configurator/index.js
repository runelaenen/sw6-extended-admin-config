import template from './laenen-field-configurator.html.twig';

const DEFAULT_FIELDS = [
    {path: 'translated.name', format: null},
    {path: 'manufacturer.translated.name', format: null},
    {path: 'stock', format: null},
    {path: 'price.0.gross', format: 'currency'},
];

export default {
    template,

    props: {
        value: {
            required: false,
            default: null,
        },
        label: {
            type: String,
            required: false,
            default: '',
        },
    },

    data() {
        return {
            fieldList: this.parseValue(this.value),
        };
    },

    computed: {
        formatOptions() {
            return [
                {id: '', name: 'Raw value'},
                {id: 'currency', name: 'Currency'},
            ];
        },
    },

    watch: {
        value(newValue) {
            this.fieldList = this.parseValue(newValue);
        },
    },

    methods: {
        parseValue(value) {
            if (!value) {
                return DEFAULT_FIELDS.map(f => ({...f}));
            }
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            } catch (e) {
                // invalid JSON — fall back to defaults
            }
            return DEFAULT_FIELDS.map(f => ({...f}));
        },

        emitChange() {
            this.$emit('update:value', JSON.stringify(this.fieldList));
        },

        addField() {
            this.fieldList.push({path: '', format: null});
            this.emitChange();
        },

        removeField(index) {
            this.fieldList.splice(index, 1);
            this.emitChange();
        },

        moveUp(index) {
            if (index === 0) return;
            const item = this.fieldList.splice(index, 1)[0];
            this.fieldList.splice(index - 1, 0, item);
            this.emitChange();
        },

        moveDown(index) {
            if (index >= this.fieldList.length - 1) return;
            const item = this.fieldList.splice(index, 1)[0];
            this.fieldList.splice(index + 1, 0, item);
            this.emitChange();
        },

        onPathChange(index, value) {
            this.fieldList[index].path = value;
            this.emitChange();
        },

        onFormatChange(index, value) {
            this.fieldList[index].format = value || null;
            this.emitChange();
        },
    },
};

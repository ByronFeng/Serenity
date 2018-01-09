namespace Serenity {

    @Serenity.Decorators.registerEditor('Serenity.AsyncLookupEditor',
        [Serenity.ISetEditValue, Serenity.IGetEditValue, Serenity.IStringValue, Serenity.IReadOnly, Serenity.IAsyncInit])
    export class AsyncLookupEditor extends LookupEditorBase<LookupEditorOptions, any> {
        constructor(hidden: JQuery, opt: LookupEditorOptions) {
            super(hidden, opt);
        }

        getLookupKey() {
            return Q.coalesce(this.options.lookupKey, super.getLookupKey());
        }
    }
}

namespace Serenity.FilterPanels {

    @Serenity.Decorators.registerClass('Serenity.FilterPanels.FieldSelect',
        [Serenity.ISetEditValue, Serenity.IGetEditValue, Serenity.IStringValue, Serenity.IReadOnly])
    export class FieldSelect extends Select2Editor<any, PropertyItem> {
        constructor(hidden: JQuery, fields: PropertyItem[]) {
            super(hidden);

            for (var field of fields) {
                this.addOption(field.name, Q.coalesce(Q.tryGetText(field.title),
                    Q.coalesce(field.title, field.name)), field);
            }
        }

        emptyItemText() {
            if (Q.isEmptyOrNull(this.value)) {
                return Q.text('Controls.FilterPanel.SelectField');
            }

            return null;
        }

        getSelect2Options() {
            var opt = super.getSelect2Options();
            opt.allowClear = false;
            return opt;
        }
    }
}

namespace Serenity.FilterPanels {

    @Serenity.Decorators.registerClass('Serenity.FilterPanels.FieldSelect',
        [Serenity.ISetEditValue, Serenity.IGetEditValue, Serenity.IStringValue, Serenity.IReadOnly])
    export class OperatorSelect extends Select2Editor<any, FilterOperator> {
        constructor(hidden: JQuery, source: FilterOperator[]) {
            super(hidden);

            for (var op of source) {
                var title = Q.coalesce(op.title, Q.coalesce(
                    Q.tryGetText("Controls.FilterPanel.OperatorNames." + op.key), op.key));
                this.addOption(op.key, title, op);
            }

            if (source.length && source[0])
                this.value = source[0].key;
        }

        emptyItemText(): string {
            return null;
        }

        getSelect2Options() {
            var opt = super.getSelect2Options();
            opt.allowClear = false;
            return opt;
        }
    }
}
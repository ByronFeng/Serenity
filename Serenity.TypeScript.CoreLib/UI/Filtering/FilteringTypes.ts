namespace Serenity {

    import Operators = FilterOperators;
    import Option = Decorators.option

    function Filtering(name: string) {
        return Decorators.registerClass('Serenity.' + name + 'Filtering')
    }

    @Filtering('Date')
    export class DateFiltering extends BaseEditorFiltering<DateEditor> {

        constructor() {
            super(DateEditor)
        }

        getOperators(): FilterOperator[] {
            return this.appendNullableOperators(this.appendComparisonOperators([]));
        }
    }

    @Filtering('DateTime')
    export class DateTimeFiltering extends BaseEditorFiltering<DateEditor> {

        constructor() {
            super(DateTimeEditor)
        }

        getOperators(): FilterOperator[] {
            return this.appendNullableOperators(
                this.appendComparisonOperators([]));
        }

        getCriteria() {
            var result: CriteriaWithText = {};

            switch (this.get_operator().key) {
                case 'eq':
                case 'ne':
                case 'lt':
                case 'le':
                case 'gt':
                case 'ge': {
                    {
                        var text = this.getEditorText();
                        result.displayText = this.displayText(this.get_operator(), [text]);
                        var date = Q.parseISODateTime(this.getEditorValue());
                        date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        var next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
                        var criteria = [this.getCriteriaField()];
                        var dateValue = Q.formatDate(date, 'yyyy-MM-dd');
                        var nextValue = Q.formatDate(next, 'yyyy-MM-dd');
                        switch (this.get_operator().key) {
                            case 'eq': {
                                result.criteria = Criteria.join([criteria, '>=', dateValue], 'and', [criteria, '<', nextValue]);
                                return result;
                            }
                            case 'ne': {
                                result.criteria = Criteria.paren(Criteria.join([criteria, '<', dateValue], 'or', [criteria, '>', nextValue]));
                                return result;
                            }
                            case 'lt': {
                                result.criteria = [criteria, '<', dateValue];
                                return result;
                            }
                            case 'le': {
                                result.criteria = [criteria, '<', nextValue];
                                return result;
                            }
                            case 'gt': {
                                result.criteria = [criteria, '>=', nextValue];
                                return result;
                            }
                            case 'ge': {
                                result.criteria = [criteria, '>=', dateValue];
                                return result;
                            }
                        }
                    }
                    break;
                }
            }

            return super.getCriteria();
        }
    }

    @Filtering('Decimal')
    export class DecimalFiltering extends BaseEditorFiltering<DecimalEditor> {
        constructor() {
            super(DecimalEditor);
        }

        getOperators(): Serenity.FilterOperator[] {
            return this.appendNullableOperators(
                this.appendComparisonOperators([]));
        }
    }

    @Filtering('Editor')
    export class EditorFiltering extends BaseEditorFiltering<Serenity.Widget<any>> {

        constructor() {
            super(Widget)
        }

        @Option()
        editorType: string;

        @Option()
        useRelative: boolean;

        @Option()
        useLike: boolean;

        getOperators(): Serenity.FilterOperator[] {
            var list = [];

            list.push({ key: Operators.EQ });
            list.push({ key: Operators.NE });

            if (this.useRelative) {
                list.push({ key: Operators.LT });
                list.push({ key: Operators.LE });
                list.push({ key: Operators.GT });
                list.push({ key: Operators.GE });
            }

            if (this.useLike) {
                list.push({ key: Operators.contains });
                list.push({ key: Operators.startsWith });
            }

            this.appendNullableOperators(list);

            return list;
        }

        protected useEditor() {
            var op = this.get_operator().key;

            return op === Operators.EQ ||
                op === Operators.NE ||
                (this.useRelative && (
                    op === Operators.LT ||
                    op === Operators.LE ||
                    op === Operators.GT ||
                    op === Operators.GE));
        }

        getEditorOptions() {
            var opt = super.getEditorOptions();
            if (this.useEditor() && this.editorType === Q.coalesce(this.get_field().editorType, 'String')) {
                opt = $.extend(opt, this.get_field().editorParams);
            }

            return opt;
        }

        createEditor() {
            if (this.useEditor()) {
                var editorType = Serenity.EditorTypeRegistry.get(this.editorType);

                this.editor = Serenity.Widget.create({
                    type: editorType as any,
                    element: e => e.appendTo(this.get_container()),
                    options: this.getEditorOptions()
                });

                return;
            }

            super.createEditor();
        }

        protected useIdField(): boolean {
            return this.useEditor();
        }

        initQuickFilter(filter: QuickFilter<Widget<any>, any>) {
            super.initQuickFilter(filter);

            filter.type = Serenity.EditorTypeRegistry.get(this.editorType) as any;
        }
    }

    @Filtering('Enum')
    export class EnumFiltering extends BaseEditorFiltering<EnumEditor> {
        constructor() {
            super(EnumEditor);
        }

        getOperators() {
            var op = [{ key: Operators.EQ }, { key: Operators.NE }];
            return this.appendNullableOperators(op);
        }
    }

    @Filtering('Integer')
    export class IntegerFiltering extends BaseEditorFiltering<IntegerEditor> {
        constructor() {
            super(IntegerEditor);
        }

        getOperators(): FilterOperator[] {
            return this.appendNullableOperators(this.appendComparisonOperators([]));
        }
    }

    @Filtering('Lookup')
    export class LookupFiltering extends BaseEditorFiltering<LookupEditor> {

        constructor() {
            super(LookupEditor);
        }

        getOperators(): FilterOperator[] {
            var ops = [{ key: Operators.EQ }, { key: Operators.NE }, { key: Operators.contains }, { key: Operators.startsWith }]
            return this.appendNullableOperators(ops);
        }

        protected useEditor(): boolean {
            var op = this.get_operator().key;
            return op == Operators.EQ || op == Operators.NE;
        }

        protected useIdField(): boolean {
            return this.useEditor();
        }

        getEditorText(): string {
            if (this.useEditor()) {
                return this.editor.text;
            }

            return super.getEditorText();
        }
    }

    @Filtering('String')
    export class StringFiltering extends BaseFiltering {

        getOperators(): Serenity.FilterOperator[] {
            var ops = [{ key: Operators.contains }, { key: Operators.startsWith }, { key: Operators.EQ },
                { key: Operators.NE }, { key: Operators.BW }];
            return this.appendNullableOperators(ops);
        }

        validateEditorValue(value: string) {
            if (value.length === 0) {
                return value;
            }

            return super.validateEditorValue(value);
        }
    }
}
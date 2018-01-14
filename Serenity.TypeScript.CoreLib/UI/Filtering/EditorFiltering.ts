namespace Serenity {

    import Operators = FilterOperators;
    import Option = Decorators.option

    @Decorators.registerClass('Serenity.EditorFiltering')
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

}
﻿namespace Serenity {

    @Serenity.Decorators.registerClass('Serenity.BaseFiltering', [IFiltering, IQuickFiltering])
    export abstract class BaseFiltering implements IFiltering, IQuickFiltering {

        private field: PropertyItem;

        public get_field() {
            return this.field;
        }

        set_field(value: PropertyItem) {
            this.field = value;
        }

        private container: JQuery;

        get_container() {
            return this.container;
        }

        set_container(value: JQuery) {
            this.container = value;
        }

        private operator: FilterOperator;

        get_operator() {
            return this.operator;
        }

        set_operator(value: FilterOperator) {
            this.operator = value;
        }

        abstract getOperators(): FilterOperator[];

        protected appendNullableOperators(list: FilterOperator[]) {
            if (!this.isNullable()) {
                return list;
            }
            list.push({ key: Serenity.FilterOperators.isNotNull });
            list.push({ key: Serenity.FilterOperators.isNull });
            return list;
        }

        protected appendComparisonOperators(list: FilterOperator[]) {
            list.push({ key: Serenity.FilterOperators.EQ });
            list.push({ key: Serenity.FilterOperators.NE });
            list.push({ key: Serenity.FilterOperators.LT });
            list.push({ key: Serenity.FilterOperators.LE });
            list.push({ key: Serenity.FilterOperators.GT });
            list.push({ key: Serenity.FilterOperators.GE });
            return list;
        }

        protected isNullable() {
            return this.get_field().required !== true;
        }

        public createEditor() {
            switch (this.get_operator().key) {
                case 'true':
                case 'false':
                case 'isnull':
                case 'isnotnull': {
                    return;
                }
                case 'contains':
                case 'startswith':
                case 'eq':
                case 'ne':
                case 'lt':
                case 'le':
                case 'gt':
                case 'ge': {
                    this.get_container().html('<input type="text"/>');
                    return;
                }
            }

            throw new ss.Exception(Q.format("Filtering '{0}' has no editor for '{1}' operator",
                (ss as any).getTypeName((ss as any).getInstanceType(this)), this.get_operator().key));
        }

        protected operatorFormat(op: FilterOperator) {
            return Q.coalesce(op.format, Q.coalesce(Q.tryGetText(
                'Controls.FilterPanel.OperatorFormats.' + op.key), op.key));
        }

        protected getTitle(field: PropertyItem) {
            return Q.coalesce(Q.tryGetText(field.title), Q.coalesce(field.title, field.name));
        }

        protected displayText(op: FilterOperator, values?: any[]) {
            if (!values || values.length === 0) {
                return Q.format(this.operatorFormat(op), this.getTitle(this.field));
            }
            else if (values.length === 1) {
                return Q.format(this.operatorFormat(op), this.getTitle(this.field), values[0]);
            }
            else {
                return Q.format(this.operatorFormat(op), this.getTitle(this.field), values[0], values[1]);
            }
        }

        protected getCriteriaField() {
            return this.field.name;
        }

        public getCriteria(): CriteriaWithText {
            var result: CriteriaWithText = {};
            var text: string;
            switch (this.get_operator().key) {
                case 'true': {
                    result.displayText = this.displayText(this.get_operator(), []);
                    result.criteria = [[this.getCriteriaField()], '=', true];
                    return result;
                }

                case 'false': {
                    result.displayText = this.displayText(this.get_operator(), []);
                    result.criteria = [[this.getCriteriaField()], '=', false];
                    return result;
                }

                case 'isnull': {
                    result.displayText = this.displayText(this.get_operator(), []);
                    result.criteria = ['is null', [this.getCriteriaField()]];
                    return result;
                }

                case 'isnotnull': {
                    result.displayText = this.displayText(this.get_operator(), []);
                    result.criteria = ['is not null', [this.getCriteriaField()]];
                    return result;
                }

                case 'contains': {
                    text = this.getEditorText();
                    result.displayText = this.displayText(this.get_operator(), [text]);
                    result.criteria = [[this.getCriteriaField()], 'like', '%' + text + '%'];
                }

                case 'startswith': {
                    text = this.getEditorText();
                    result.displayText = this.displayText(this.get_operator(), [text]);
                    result.criteria = [[this.getCriteriaField()], 'like', text + '%'];
                    return result;
                }

                case 'eq':
                case 'ne':
                case 'lt':
                case 'le':
                case 'gt':
                case 'ge': {
                    text = this.getEditorText();
                    result.displayText = this.displayText(this.get_operator(), [text]);
                    result.criteria = [[this.getCriteriaField()], Serenity.FilterOperators.toCriteriaOperator[
                        this.get_operator().key], this.getEditorValue()];
                    return result;
                }
            }

            throw new ss.Exception(Q.format("Filtering '{0}' has no handler for '{1}' operator",
                (ss as any).getTypeName((ss as any).getInstanceType(this)), this.get_operator().key));
        }

        loadState(state: any) {
            var input = this.get_container().find(':input').first();
            input.val(state);
        }

        saveState() {
            switch (this.get_operator().key) {
                case 'contains':
                case 'startswith':
                case 'eq':
                case 'ne':
                case 'lt':
                case 'le':
                case 'gt':
                case 'ge': {
                    var input = this.get_container().find(':input').first();
                    return input.val();
                }
            }
            return null;
        }

        protected argumentNull() {
            return new (ss as any).ArgumentNullException('value', Q.text('Controls.FilterPanel.ValueRequired'));
        }

        validateEditorValue(value: string) {
            if (value.length === 0) {
                throw this.argumentNull();
            }
            return value;
        }

        getEditorValue() {
            var input = this.get_container().find(':input').not('.select2-focusser').first();
            if (input.length !== 1) {
                throw new ss.Exception(Q.format("Couldn't find input in filter container for {0}",
                    Q.coalesce(this.field.title, this.field.name)));
            }

            var value;
            if (input.data('select2') != null) {
                value = input.select2('val');
            }
            else {
                value = input.val();
            }

            value = Q.coalesce(value, '').trim();

            return this.validateEditorValue(value);
        }

        getEditorText() {
            var input = this.get_container().find(':input').not('.select2-focusser').not('.select2-input').first();
            if (input.length === 0) {
                return this.get_container().text().trim();
            }
            var value;
            if (input.data('select2') != null) {
                value = Q.coalesce(input.select2('data'), {}).text;
            }
            else {
                value = input.val();
            }
            return value;
        }

        initQuickFilter(filter: QuickFilter<Widget<any>, any>) {
            filter.field = this.getCriteriaField();
            filter.type = Serenity.StringEditor;
            filter.title = this.getTitle(this.field);
            filter.options = Q.deepClone({}, this.get_field().quickFilterParams);
        }
    }

    @Serenity.Decorators.registerClass('Serenity.BaseEditorFiltering')
    export abstract class BaseEditorFiltering<TEditor extends Widget<any>> extends BaseFiltering {
        constructor(public editorType: any) {
            super();
        }

        protected useEditor() {
            switch (this.get_operator().key) {
                case 'eq':
                case 'ne':
                case 'lt':
                case 'le':
                case 'gt':
                case 'ge':
                    return true;
            }
            return false;
        }

        protected editor: TEditor;

        createEditor() {
            if (this.useEditor()) {
                this.editor = Serenity.Widget.create({
                    type: this.editorType,
                    container: this.get_container(),
                    options: this.getEditorOptions(),
                    init: null
                }) as any;
                return;
            }
            this.editor = null;
            super.createEditor();
        }

        protected useIdField() {
            return false;
        }

        getCriteriaField() {
            if (this.useEditor() &&
                this.useIdField() &&
                !Q.isEmptyOrNull(this.get_field().filteringIdField)) {
                return this.get_field().filteringIdField;
            }

            return super.getCriteriaField();
        }

        getEditorOptions() {
            var opt = Q.deepClone({}, this.get_field().editorParams);
            delete opt['cascadeFrom'];
            // currently can't support cascadeFrom in filtering
            return Q.deepClone(opt, this.get_field().filteringParams);
        }

        loadState(state: any) {
            if (this.useEditor()) {
                if (state == null) {
                    return;
                }

                Serenity.EditorUtils.setValue(this.editor, state);
                return;
            }

            super.loadState(state);
        }

        saveState() {
            if (this.useEditor()) {
                return Serenity.EditorUtils.getValue(this.editor);
            }

            return super.saveState();
        }

        getEditorValue() {
            if (this.useEditor()) {
                var value = Serenity.EditorUtils.getValue(this.editor);

                if (value == null || (typeof value == "string" && value.trim().length === 0))
                    throw this.argumentNull();

                return value;
            }

            return super.getEditorValue();
        }

        initQuickFilter(filter: QuickFilter<Widget<any>, any>) {
            super.initQuickFilter(filter);

            filter.type = this.editorType;
            filter.options = Q.deepClone({},
                this.getEditorOptions(),
                this.get_field().quickFilterParams);
        }
    }
}
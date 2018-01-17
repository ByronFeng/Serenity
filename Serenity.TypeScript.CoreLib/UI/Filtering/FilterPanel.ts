﻿namespace Serenity {

    @Decorators.registerClass('Serenity.FilterFieldSelect')
    class FilterFieldSelect extends Select2Editor<any, PropertyItem> {
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

    @Decorators.registerClass('Serenity.FilterOperatorSelect')
    class FilterOperatorSelect extends Select2Editor<any, FilterOperator> {
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

    export class FilterPanel extends FilterWidgetBase<any> {
        static panelTemplate: string;
        static rowTemplate: string;

        private rowsDiv: JQuery;

        constructor(div: JQuery) {
            super(div);

            this.element.addClass('s-FilterPanel');
            this.rowsDiv = this.byId('Rows');
            this.initButtons();
            this.updateButtons();
        }

        private showInitialLine: boolean;

        get_showInitialLine() {
            return this.showInitialLine;
        }

        set_showInitialLine(value: boolean) {
            if (this.showInitialLine !== value) {
                this.showInitialLine = value;
                if (this.showInitialLine && this.rowsDiv.children().length === 0) {
                    this.addEmptyRow(false);
                }
            }
        }

        protected filterStoreChanged() {
            super.filterStoreChanged();
            this.updateRowsFromStore();
        }

        updateRowsFromStore() {
            this.rowsDiv.empty();

            var items = this.get_store().get_items();
            for (var item of items) {
                this.addEmptyRow(false);

                var row = this.rowsDiv.children().last();

                var divl = row.children('div.l');
                divl.children('.leftparen').toggleClass('active', !!item.leftParen);
                divl.children('.rightparen').toggleClass('active', !!item.rightParen);
                divl.children('.andor').toggleClass('or', !!item.isOr)
                    .text(Q.text((!!item.isOr ? 'Controls.FilterPanel.Or' :
                        'Controls.FilterPanel.And')));

                var fieldSelect = row.children('div.f')
                    .find('input.field-select').getWidget(FilterFieldSelect);

                fieldSelect.value = item.field;
                this.rowFieldChange(row);
                var operatorSelect = row.children('div.o')
                    .find('input.op-select').getWidget(FilterOperatorSelect);

                operatorSelect.set_value(item.operator);
                this.rowOperatorChange(row);

                var filtering = this.getFilteringFor(row);
                if (filtering != null) {
                    filtering.set_operator({ key: item.operator });
                    filtering.loadState(item.state);
                }
            }

            if (this.get_showInitialLine() && this.rowsDiv.children().length === 0) {
                this.addEmptyRow(false);
            }

            this.updateParens();
        }

        private showSearchButton: boolean;

        get_showSearchButton(): boolean {
            return this.showSearchButton;
        }

        set_showSearchButton(value: boolean): void {
            if (this.showSearchButton !== value) {
                this.showSearchButton = value;
                this.updateButtons();
            }
        }

        private updateStoreOnReset: boolean;

        get_updateStoreOnReset() {
            return this.updateStoreOnReset;
        }

        set_updateStoreOnReset(value: boolean): void {
            if (this.updateStoreOnReset !== value) {
                this.updateStoreOnReset = value;
            }
        }

        protected getTemplate(): string {
            return FilterPanel.panelTemplate;
        }

        protected initButtons(): void {
            this.byId('AddButton').text(Q.text('Controls.FilterPanel.AddFilter'))
                .click((e) => this.addButtonClick(e));

            this.byId('SearchButton').text(Q.text('Controls.FilterPanel.SearchButton'))
                .click((e) => this.searchButtonClick(e));

            this.byId('ResetButton').text(Q.text('Controls.FilterPanel.ResetButton'))
                .click((e) => this.resetButtonClick(e));
        }

        protected searchButtonClick(e: JQueryEventObject) {
            e.preventDefault();
            this.search();
        }

        get_hasErrors(): boolean {
            return this.rowsDiv.children().children('div.v')
                .children('span.error').length > 0;
        }

        search() {
            this.rowsDiv.children().children('div.v')
                .children('span.error').remove();

            var filterLines = [];
            var errorText = null;
            var row = null;
            for (var i = 0; i < this.rowsDiv.children().length; i++) {
                try {
                    row = this.rowsDiv.children().eq(i);
                    var filtering = this.getFilteringFor(row);
                    if (filtering == null) {
                        continue;
                    }

                    var field = this.getFieldFor(row);
                    var op = row.children('div.o').find('input.op-select')
                        .getWidget(FilterOperatorSelect).value;

                    if (op == null || op.length === 0) 
                        throw new (ss as any).ArgumentOutOfRangeException('operator',
                            Q.text('Controls.FilterPanel.InvalidOperator'));

                    var line: FilterLine = {};
                    line.field = field.name;
                    line.operator = op;
                    line.isOr = row.children('div.l')
                        .children('a.andor').hasClass('or');
                    line.leftParen = row.children('div.l')
                        .children('a.leftparen').hasClass('active');
                    line.rightParen = row.children('div.l')
                        .children('a.rightparen').hasClass('active');
                    filtering.set_operator({ key: op });
                    var criteria = filtering.getCriteria();
                    line.criteria = criteria.criteria;
                    line.state = filtering.saveState();
                    line.displayText = criteria.displayText;
                    filterLines.push(line);
                }
                catch (ex) {
                    ex = (ss.Exception as any).wrap(ex);
                    if ((ss as any).isInstanceOfType(ex, (ss as any).ArgumentException)) {
                        errorText = ex.get_message();
                        break;
                    }
                    else {
                        throw ex;
                    }
                }
            }

            // if an error occured, display it, otherwise set current filters
            if (errorText != null) {
                $('<span/>').addClass('error')
                    .attr('title', errorText).appendTo(row.children('div.v'));
                row.children('div.v').find('input:first').focus();
                return;
            }

            (ss as any).clear(this.get_store().get_items());
            (ss as any).arrayAddRange(this.get_store().get_items(), filterLines);
            this.get_store().raiseChanged();
        }

        protected addButtonClick(e: JQueryEventObject) {
            this.addEmptyRow(true);
            e.preventDefault();
        }

        protected resetButtonClick(e: JQueryEventObject) {
            e.preventDefault();

            if (this.get_updateStoreOnReset()) {
                if (this.get_store().get_items().length > 0) {
                    (ss as any).clear(this.get_store().get_items());
                    this.get_store().raiseChanged();
                }
            }

            this.rowsDiv.empty();
            this.updateButtons();
            if (this.get_showInitialLine()) {
                this.addEmptyRow(false);
            }
        }

        protected findEmptyRow(): JQuery {
            var result: JQuery = null;

            this.rowsDiv.children().each(function (index, row) {
                var fieldInput = $(row).children('div.f')
                    .children('input.field-select').first();
                if (fieldInput.length === 0) {
                    return true;
                }
                var val = fieldInput.val();
                if (val == null || val.length === 0) {
                    result = $(row);
                    return false;
                }
                return true;
            });

            return result;
        }

        protected addEmptyRow(popupField: boolean) {
            var emptyRow = this.findEmptyRow();

            if (emptyRow != null) {
                emptyRow.find('input.field-select').select2('focus');
                if (popupField) {
                    emptyRow.find('input.field-select').select2('open');
                }
                return emptyRow;
            }

            var isLastRowOr = this.rowsDiv.children().last()
                .children('a.andor').hasClass('or');

            var row = $(FilterPanel.rowTemplate).appendTo(this.rowsDiv);
            var parenDiv = row.children('div.l').hide();

            parenDiv.children('a.leftparen, a.rightparen')
                .click((e) => this.leftRightParenClick(e));

            var andor = parenDiv.children('a.andor').attr('title', Q.text('Controls.FilterPanel.ChangeAndOr'));
            if (isLastRowOr) {
                andor.addClass('or').text(Q.text('Controls.FilterPanel.Or'));
            }
            else {
                andor.text(Q.text('Controls.FilterPanel.And'));
            }

            andor.click((e) => this.andOrClick(e));

            row.children('a.delete')
                .attr('title', Q.text('Controls.FilterPanel.RemoveField'))
                .click((e) => this.deleteRowClick(e));

            var fieldSel = new FilterFieldSelect(row.children('div.f')
                .children('input'), this.get_store().get_fields())
                .changeSelect2(e => this.onRowFieldChange(e));

            this.updateParens();
            this.updateButtons();

            row.find('input.field-select').select2('focus');

            if (popupField) {
                row.find('input.field-select').select2('open');
            }

            return row;
        }

        protected onRowFieldChange(e: JQueryEventObject) {
            var row = $(e.target).closest('div.filter-line');
            this.rowFieldChange(row);
            var opSelect = row.children('div.o').find('input.op-select');
            opSelect.select2('focus');
        }

        protected rowFieldChange(row: JQuery) {
            row.removeData('Filtering');
            var select = row.children('div.f').find('input.field-select')
                .getWidget(FilterFieldSelect);
            var fieldName = select.get_value();
            var isEmpty = fieldName == null || fieldName === '';
            this.removeFiltering(row);
            this.populateOperatorList(row);
            this.rowOperatorChange(row);
            this.updateParens();
            this.updateButtons();
        }

        protected removeFiltering(row: JQuery): void {
            row.data('Filtering', null);
            row.data('FilteringField', null);
        }

        protected populateOperatorList(row: JQuery): void {
            row.children('div.o').html('');

            var filtering = this.getFilteringFor(row);
            if (filtering == null)
                return;

            var hidden = row.children('div.o').html('<input/>')
                .children().attr('type', 'hidden').addClass('op-select');

            var operators = filtering.getOperators();
            var opSelect = new FilterOperatorSelect(hidden, operators);
            opSelect.changeSelect2(e => this.onRowOperatorChange(e));
        }

        protected getFieldFor(row: JQuery) {
            if (row.length === 0) {
                return null;
            }
            var select = row.children('div.f').find('input.field-select')
                .getWidget(FilterFieldSelect);

            if (Q.isEmptyOrNull(select.value)) {
                return null;
            }

            return this.get_store().get_fieldByName()[select.get_value()];
        }

        protected getFilteringFor(row: JQuery): IFiltering {
            var field = this.getFieldFor(row);

            if (field == null)
                return null;

            var filtering = (ss as any).cast(row.data('Filtering'), IFiltering);

            if (filtering != null)
                return filtering;

            var filteringType = FilteringTypeRegistry.get(
                Q.coalesce(field.filteringType, 'String'));

            var editorDiv = row.children('div.v');
            filtering = (ss as any).cast((ss as any).createInstance(filteringType), IFiltering);
            ReflectionOptionsSetter.set(filtering, field.filteringParams);
            filtering.set_container(editorDiv);
            filtering.set_field(field);
            row.data('Filtering', filtering);
            return filtering;
        }

        protected onRowOperatorChange(e: JQueryEventObject) {
            var row = $(e.target).closest('div.filter-line');
            this.rowOperatorChange(row);
            var firstInput = row.children('div.v').find(':input:visible').first();
            try {
                firstInput.focus();
            }
            catch ($t1) {
            }
        }

        protected rowOperatorChange(row: JQuery): void {

            if (row.length === 0) {
                return;
            }

            var editorDiv = row.children('div.v');
            editorDiv.html('');
            var filtering = this.getFilteringFor(row);
            if (filtering == null)
                return;
            
            var operatorSelect = row.children('div.o').find('input.op-select')
                .getWidget(FilterOperatorSelect);

            if (Q.isEmptyOrNull(operatorSelect.get_value()))
                return;
            
            var ops = filtering.getOperators().filter(function (x) {
                return x.key === operatorSelect.value;
            });

            var op = ((ops.length > 0) ? ops[0] : null);
            if (op == null)
                return;

            filtering.set_operator(op);
            filtering.createEditor();
        }

        protected deleteRowClick(e: JQueryEventObject): void {
            e.preventDefault();
            var row = $(e.target).closest('div.filter-line');
            row.remove();

            if (this.rowsDiv.children().length === 0) {
                this.search();
            }

            this.updateParens();
            this.updateButtons();
        }

        protected updateButtons(): void {
            this.byId('SearchButton').toggle(
                this.rowsDiv.children().length >= 1 && this.showSearchButton);
            this.byId('ResetButton').toggle(
                this.rowsDiv.children().length >= 1);
        }

        protected andOrClick(e: JQueryEventObject): void {
            e.preventDefault();
            var andor = $(e.target).toggleClass('or');
            andor.text(Q.text('Controls.FilterPanel.' +
                (andor.hasClass('or') ? 'Or' : 'And')));
        }

        protected leftRightParenClick(e: JQueryEventObject): void {
            e.preventDefault();
            $(e.target).toggleClass('active');
            this.updateParens();
        }

        protected updateParens() {
            var rows = this.rowsDiv.children();
            if (rows.length === 0) {
                return;
            }
            rows.removeClass('paren-start');
            rows.removeClass('paren-end');
            rows.children('div.l').css('display', ((rows.length === 1) ? 'none' : 'block'));
            rows.first().children('div.l').children('a.rightparen, a.andor')
                .css('visibility', 'hidden');

            for (var i = 1; i < rows.length; i++) {
                var row = rows.eq(i);
                row.children('div.l').css('display', 'block')
                    .children('a.lefparen, a.andor').css('visibility', 'visible');
            }

            var inParen = false;
            for (var i1 = 0; i1 < rows.length; i1++) {
                var row1 = rows.eq(i1);
                var divParen = row1.children('div.l');
                var lp = divParen.children('a.leftparen');
                var rp = divParen.children('a.rightparen');
                if (rp.hasClass('active') && inParen) {
                    inParen = false;
                    if (i1 > 0) {
                        rows.eq(i1 - 1).addClass('paren-end');
                    }
                }
                if (lp.hasClass('active')) {
                    inParen = true;
                    if (i1 > 0) {
                        row1.addClass('paren-start');
                    }
                }
            }
        }
    }
}
namespace Serenity {
    @Decorators.registerClass('Serenity.GridRowSelectionMixin')
    export class GridRowSelectionMixin {

        private idField: string;
        private include: Q.Dictionary<boolean>;
        private grid: IDataGrid;

        constructor(grid: IDataGrid) {

            this.include = {};
            this.grid = grid;
            this.idField = (grid.getView() as any).idField;

            grid.getGrid().onClick.subscribe((e, p) => {
                if ($(e.target).hasClass('select-item')) {
                    e.preventDefault();
                    var item = grid.getView().getItem(p.row);
                    var id = item[this.idField].toString();

                    if (!this.include[id]) {
                        delete this.include[id];
                    }
                    else {
                        this.include[id] = true;
                    }

                    for (var i = 0; i < (grid.getView() as any).getLength(); i++) {
                        grid.getGrid().updateRow(i);
                    }

                    this.updateSelectAll();
                }
            });

            grid.getGrid().onHeaderClick.subscribe((e1, u) => {
                if (e1.isDefaultPrevented()) {
                    return;
                }
                if ($(e1.target).hasClass('select-all-items')) {
                    e1.preventDefault();
                    var view = grid.getView();
                    if (Object.keys(this.include).length > 0) {
                        (ss as any).clearKeys(this.include);
                    }
                    else {
                        var items = grid.getView().getItems();
                        for (var x of items) {
                            var id1 = x[this.idField];
                            this.include[id1] = true;
                        }
                    }
                    this.updateSelectAll();
                    grid.getView().setItems(grid.getView().getItems(), true);
                }
            });

            (grid.getView() as any).onRowsChanged.subscribe(() => {
                return this.updateSelectAll();
            });
        }

        updateSelectAll(): void {
            var selectAllButton = this.grid.getElement()
                .find('.select-all-header .slick-column-name .select-all-items');

            if (selectAllButton) {
                var keys = Object.keys(this.include);
                selectAllButton.toggleClass('checked',
                    keys.length > 0 &&
                    this.grid.getView().getItems().length === keys.length);
            }
        }

        clear(): void {
            (ss as any).clearKeys(this.include);
            this.updateSelectAll();
        }

        resetCheckedAndRefresh(): void {
            this.include = {};
            this.updateSelectAll();
            this.grid.getView().populate();
        }

        selectKeys(keys: string[]): void {
            for (var k of keys) {
                this.include[k] = true;
            }

            this.updateSelectAll();
        }

        getSelectedKeys(): string[] {
            return Object.keys(this.include);
        }

        getSelectedAsInt32(): number[] {
            return Object.keys(this.include).map(function (x) {
                return parseInt(x, 10);
            });
        }

        getSelectedAsInt64(): number[] {
            return Object.keys(this.include).map(function (x) {
                return parseInt(x, 10);
            });
        }

        setSelectedKeys(keys: string[]): void {
            this.clear();
            for (var k of keys) {
                this.include[k] = true;
            }

            this.updateSelectAll();
        }

        static createSelectColumn(getMixin: () => GridRowSelectionMixin): Slick.Column {
            return {
                name: '<span class="select-all-items check-box no-float "></span>',
                toolTip: ' ',
                field: '__select__',
                width: 26,
                minWidth: 26,
                headerCssClass: 'select-all-header',
                sortable: false,
                format: function (ctx) {
                    var item = ctx.item;
                    var mixin = getMixin();
                    if (!mixin) {
                        return '';
                    }
                    var isChecked = mixin.include[ctx.item[mixin.idField]];
                    return '<span class="select-item check-box no-float ' + (isChecked ? ' checked' : '') + '"></span>';
                }
            };
        }
    }

    export namespace GridSelectAllButtonHelper {
        export function update(grid: IDataGrid, getSelected: (p1: any) => boolean): void {
            var toolbar = (grid as any).element.children('.s-Toolbar') as JQuery;
            if (toolbar.length === 0) {
                return;
            }
            var btn = toolbar.getWidget(Toolbar).findButton('select-all-button');
            var items = grid.getView().getItems();
            btn.toggleClass('checked', items.length > 0 && !items.some(function (x) {
                return !getSelected(x);
            }));
        }

        export function define(getGrid: () => IDataGrid, getId: (p1: any) => any,
            getSelected: (p1: any) => boolean,
            setSelected: (p1: any, p2: boolean) => void,
            text?: string, onClick?: () => void): ToolButton {

            if (text == null) {
                text = Q.coalesce(Q.tryGetText('Controls.CheckTreeEditor.SelectAll'),
                    'Select All');
            }
            return {
                title: text,
                cssClass: 'select-all-button',
                onClick: function () {
                    var grid = getGrid();
                    var view = grid.getView();
                    var btn = (grid as any).element.children('.s-Toolbar')
                        .getWidget(Toolbar).findButton('select-all-button');
                    var makeSelected = !btn.hasClass('checked');
                    view.beginUpdate();
                    try {
                        for (var item of view.getItems()) {
                            setSelected(item, makeSelected);
                            view.updateItem(getId(item), item);
                        }
                        onClick && onClick();
                    }
                    finally {
                        view.endUpdate();
                    }

                    btn.toggleClass('checked', makeSelected);
                }
            };
        }
    }

    export namespace GridUtils {
        export function addToggleButton(toolDiv: JQuery, cssClass: string,
            callback: (p1: boolean) => void, hint: string, initial?: boolean): void {

            var div = $('<div><a href="#"></a></div>')
                .addClass('s-ToggleButton').addClass(cssClass)
                .prependTo(toolDiv);
            div.children('a').click(function (e) {
                e.preventDefault();
                div.toggleClass('pressed');
                var pressed = div.hasClass('pressed');
                callback && callback(pressed);
            }).attr('title', Q.coalesce(hint, ''));
            if (initial) {
                div.addClass('pressed');
            }
        }

        export function addIncludeDeletedToggle(toolDiv: JQuery,
            view: Slick.RemoteView<any>, hint?: string, initial?: boolean): void {

            var includeDeleted = false;
            var oldSubmit = view.onSubmit;
            view.onSubmit = function (v) {
                v.params.IncludeDeleted = includeDeleted;
                if (oldSubmit != null) {
                    return oldSubmit(v);
                }
                return true;
            };

            if (hint == null) 
                hint = Q.text('Controls.EntityGrid.IncludeDeletedToggle');
            
            addToggleButton(toolDiv, 's-IncludeDeletedToggle',
                function (pressed) {
                    includeDeleted = pressed;
                    view.seekToPage = 1;
                    view.populate();
                }, hint, initial);
            toolDiv.bind('remove', function () {
                view.onSubmit = null;
                oldSubmit = null;
            });
        }

        export function addQuickSearchInput(toolDiv: JQuery,
            view: Slick.RemoteView<any>, fields?: QuickSearchField[]): void {

            var oldSubmit = view.onSubmit;
            var searchText = '';
            var searchField = '';
            view.onSubmit = function (v) {
                if (searchText != null && searchText.length > 0) {
                    v.params.ContainsText = searchText;
                }
                else {
                    delete v.params['ContainsText'];
                }
                if (searchField != null && searchField.length > 0) {
                    v.params.ContainsField = searchField;
                }
                else {
                    delete v.params['ContainsField'];
                }

                if (oldSubmit != null) 
                    return oldSubmit(v);
                
                return true;
            };

            var lastDoneEvent: any = null;
            addQuickSearchInputCustom(toolDiv, (field, query, done) => {
                searchText = query;
                searchField = field;
                view.seekToPage = 1;
                lastDoneEvent = done;
                view.populate();
            }, fields);

            view.onDataLoaded.subscribe(function (e, ui) {
                if (lastDoneEvent != null) {
                    lastDoneEvent(view.getLength() > 0);
                    lastDoneEvent = null;
                }
            });
        }

        function addQuickSearchInputCustom(container: JQuery,
            onSearch: (p1: string, p2: string, done: (p3: boolean) => void) => void,
            fields?: QuickSearchField[]) {

            var div = $('<div><input type="text"/></div>')
                .addClass('s-QuickSearchBar').prependTo(container);

            if (fields != null && fields.length > 0) {
                div.addClass('has-quick-search-fields');
            }

            new QuickSearchInput(div.children(), {
                fields: fields,
                onSearch: onSearch as any
            });
        }

        export function makeOrderable(grid: Slick.Grid,
            handleMove: (p1: any, p2: number) => void): void {

            var moveRowsPlugin = new Slick.RowMoveManager({ cancelEditOnDrag: true });
            moveRowsPlugin.onBeforeMoveRows.subscribe(function (e, data) {
                for (var i = 0; !!(i < data.rows.length); i++) {
                    if (!!(data.rows[i] === data.insertBefore ||
                        data.rows[i] === data.insertBefore - 1)) {
                        e.stopPropagation();
                        return false;
                    }
                }

                return true;
            });

            moveRowsPlugin.onMoveRows.subscribe(function (e1, data1) {
                handleMove(data1.rows, data1.insertBefore);
                try {
                    grid.setSelectedRows([]);
                }
                catch ($t1) {
                }
            });
            grid.registerPlugin(moveRowsPlugin);
        }

        export function makeOrderableWithUpdateRequest(grid: DataGrid<any, any>,
            getId: (p1: any) => number, getDisplayOrder: (p1: any) => any, service: string,
            getUpdateRequest: (p1: number, p2: number) => SaveRequest<any>): void {

            makeOrderable(grid.slickGrid, function (rows, insertBefore) {
                if (rows.length === 0) {
                    return;
                }

                var order: number;
                var index = insertBefore;
                if (index < 0) {
                    order = 1;
                }
                else if (insertBefore >= grid.rowCount()) {
                    order = Q.coalesce(getDisplayOrder(
                        grid.itemAt(grid.rowCount() - 1)), 0);
                    if (order === 0) {
                        order = insertBefore + 1;
                    }
                    else {
                        order = order + 1;
                    }
                }
                else {
                    order = Q.coalesce(getDisplayOrder(
                        grid.itemAt(insertBefore)), 0);
                    if (order === 0) {
                        order = insertBefore + 1;
                    }
                }

                var i = 0;
                var next: any = null;
                next = function () {
                    Q.serviceCall({
                        service: service,
                        request: getUpdateRequest(getId(
                            grid.itemAt(rows[i])), order++),
                        onSuccess: function (response) {
                            i++;
                            if (i < rows.length) {
                                next();
                            }
                            else {
                                grid.view.populate();
                            }
                        }
                    });
                };
                next();
            });
        }
    }
}

declare namespace Serenity {

    
    interface QuickSearchField {
        name: string;
        title: string;
    }

    namespace PropertyItemSlickConverter {
        function toSlickColumns(items: PropertyItem[]): Slick.Column[];
        function toSlickColumn(item: PropertyItem): Slick.Column;
    }

    namespace SlickTreeHelper {
        function filterCustom<TItem>(item: TItem, getParent: (x: TItem) => any): boolean;
        function filterById<TItem>(item: TItem, view: Slick.RemoteView<TItem>, getParentId: (x: TItem) => any): boolean;
        function setCollapsed<TItem>(items: TItem[], collapsed: boolean): void;
        function setCollapsedFlag<TItem>(item: TItem, collapsed: boolean): void;
        function setIndents<TItem>(items: TItem[], getId: (x: TItem) => any, getParentId: (x: TItem) => any, setCollapsed?: boolean): void;
        function toggleClick<TItem>(e: JQueryEventObject, row: number, cell: number, view: Slick.RemoteView<TItem>, getId: (x: TItem) => any): void;
    }

    namespace SlickFormatting {
        function getEnumText(value: any): string;
        function getEnumText(enumKey: string, name: string): string;
        function treeToggle<TItem>(getView: () => Slick.RemoteView<TItem>, getId: (x: TItem) => any,
            formatter: Slick.Format): Slick.Format;
        function date(format?: string): Slick.Format;
        function dateTime(format?: string): Slick.Format;
        function checkBox(): Slick.Format;
        function number(format: string): Slick.Format;
        function getItemType(link: JQuery): string;
        function getItemId(link: JQuery): string;
        function itemLinkText(itemType: string, id: any, text: any, extraClass: string, encode: boolean): string;
        function itemLink(itemType: string, idField: string, getText: Slick.Format,
            cssClass?: Slick.Format, encode?: boolean): Slick.Format;
    }

    namespace SlickHelper {
        function setDefaults(columns: any, localTextPrefix?: string): any;
        function convertToFormatter(format: Slick.Format): Slick.ColumnFormatter;
    }
}
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
}

declare namespace Serenity {
    

    namespace GridSelectAllButtonHelper {
        function update(grid: IDataGrid, getSelected: (p1: any) => boolean): void;
        function define(getGrid: () => IDataGrid, getId: (p1: any) => any, getSelected: (p1: any) => boolean, setSelected: (p1: any, p2: boolean) => void, text?: string, onClick?: () => void): ToolButton;
    }

    namespace GridUtils {
        function addToggleButton(toolDiv: JQuery, cssClass: string, callback: (p1: boolean) => void, hint: string, initial?: boolean): void;
        function addIncludeDeletedToggle(toolDiv: JQuery, view: Slick.RemoteView<any>, hint?: string, initial?: boolean): void;
        function addQuickSearchInput(toolDiv: JQuery, view: Slick.RemoteView<any>, fields?: QuickSearchField[]): void;
        function addQuickSearchInputCustom(container: JQuery, onSearch: (p1: string, p2: string) => void, fields?: QuickSearchField[]): void;
        function addQuickSearchInputCustom(container: JQuery, onSearch: (p1: string, p2: string, p3: (p1: boolean) => void) => void, fields?: QuickSearchField[]): void;
        function makeOrderable(grid: Slick.Grid, handleMove: (p1: any, p2: number) => void): void;
        function makeOrderableWithUpdateRequest(grid: DataGrid<any, any>, getId: (p1: any) => number, getDisplayOrder: (p1: any) => any, service: string, getUpdateRequest: (p1: number, p2: number) => SaveRequest<any>): void;
    }

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
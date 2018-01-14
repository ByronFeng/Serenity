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

namespace Serenity {
    @Serenity.Decorators.registerClass('Serenity.BooleanFiltering')
    export class BooleanFiltering extends BaseFiltering {
        getOperators() {
            return this.appendNullableOperators([
                { key: Serenity.FilterOperators.isTrue },
                { key: Serenity.FilterOperators.isFalse }
            ]);
        }
    }
}

namespace Serenity {
    @Serenity.Decorators.registerClass('Serenity.CascadedWidgetLink')
    export class CascadedWidgetLink<TParent extends Widget<any>> {

        constructor(private parentType: { new(...args: any[]): TParent },
            private widget: Serenity.Widget<any>,
            private parentChange: (p1: TParent) => void) {
            this.bind();
            this.widget.element.bind('remove.' + (widget as any).uniqueName + 'cwh', e => {
                this.unbind();
                this.widget = null;
                this.parentChange = null;
            });
        }

        private _parentID: string;

        bind() {

            if (Q.isEmptyOrNull(this._parentID)) {
                return null;
            }

            var parent = Q.findElementWithRelativeId(this.widget.element, this._parentID)
                .tryGetWidget(this.parentType);

            if (parent != null) {
                parent.element.bind('change.' + (this.widget as any).uniqueName, () => {
                    this.parentChange(parent);
                });
                return parent;
            }
			else {
                Q.notifyError("Can't find cascaded parent element with ID: " + this._parentID + '!', '', null);
                return null;
            }
        }

        unbind() {

            if (Q.isEmptyOrNull(this._parentID)) {
                return null;
            }

			var parent = Q.findElementWithRelativeId(this.widget.element, this._parentID).tryGetWidget(this.parentType);

            if (parent != null) {
                parent.element.unbind('.' + (this.widget as any).uniqueName);
            }

			return parent;
        }

        get_parentID() {
            return this._parentID;
        }

        set_parentID(value: string) {

            if (this._parentID !== value) {
                this.unbind();
                this._parentID = value;
                this.bind();
            }
        }
    }
}

namespace Serenity.DialogExtensions {
    export function dialogFlexify(dialog: JQuery): JQuery {
        var flexify = new Serenity.Flexify(dialog.closest('.ui-dialog'), {});
        return dialog;
    }

    export function dialogResizable(dialog: JQuery, w?: any, h?: any, mw?: any, mh?: any): JQuery {
        var dlg = dialog.dialog();
        dlg.dialog('option', 'resizable', true);
        if (mw != null) {
            dlg.dialog('option', 'minWidth', mw);
        }
        if (w != null) {
            dlg.dialog('option', 'width', w);
        }
        if (mh != null) {
            dlg.dialog('option', 'minHeight', mh);
        }
        if (h != null) {
            dlg.dialog('option', 'height', h);
        }
        return dialog;
    }

    export function dialogMaximizable(dialog: JQuery): JQuery {
        (dialog as any).dialogExtend({
            closable: true,
            maximizable: true,
            dblclick: 'maximize',
            icons: { maximize: 'ui-icon-maximize-window' }
        });

        return dialog;
    }

    function dialogCloseOnEnter(dialog: JQuery): JQuery {
        dialog.bind('keydown', function (e) {
            if (e.which !== 13) {
                return;
            }
            var tagName = e.target.tagName.toLowerCase();
            if (tagName === 'button' || tagName === 'select' || tagName === 'textarea' ||
                tagName === 'input' && e.target.getAttribute('type') === 'button') {
                return;
            }
            var dlg = $(this);
            if (!dlg.hasClass('ui-dialog')) {
                dlg = dlg.closest('.ui-dialog');
            }
            var buttons = dlg.children('.ui-dialog-buttonpane').find('button');
            if (buttons.length > 0) {
                var defaultButton = buttons.find('.default-button');
                if (defaultButton.length > 0) {
                    buttons = defaultButton;
                }
            }
            var button = buttons.eq(0);
            if (!button.is(':disabled')) {
                e.preventDefault();
                button.trigger('click');
            }
        });
        return dialog;
    }
}

namespace Serenity.DialogTypeRegistry {
    function search(typeName: string) {

        var dialogType = (ss as any).getType(typeName);
        if (dialogType != null && (ss as any).isAssignableFrom(Serenity.IDialog, dialogType)) {
            return dialogType;
        }

        for (var ns of Q.Config.rootNamespaces) {
            dialogType = (ss as any).getType(ns + '.' + typeName);
            if (dialogType != null && (ss as any).isAssignableFrom(Serenity.IDialog, dialogType)) {
                return dialogType;
            }
        }
        return null;
    }

    var knownTypes: Q.Dictionary<any> = {};

    export function tryGet(key: string): Function {
        if (knownTypes[key] == null) {
            var typeName = key;
            var dialogType = search(typeName);

            if (dialogType == null && !Q.endsWith(key, 'Dialog')) {
                typeName = key + 'Dialog';
                dialogType = search(typeName);
            }

            if (dialogType == null) {
                return null;
            }

            knownTypes[key] = dialogType;
            return dialogType;
        }

        return knownTypes[key];
    }

    export function get(key: string): Function {

        var type = tryGet(key);

        if (type == null) {
            var message = key + ' dialog class is not found! Make sure there is a dialog class with this name, ' +
                'it is under your project root namespace, and your namespace parts start with capital letters, ' +
                'e.g. MyProject.Pascal.Cased namespace. If you got this error from an editor with InplaceAdd option ' +
                'check that lookup key and dialog type name matches (case sensitive, excluding Dialog suffix). ' +
                "You need to change lookup key or specify DialogType property in LookupEditor attribute if that's not the case.";

            Q.notifyError(message, '', null);

            throw new ss.Exception(message);
        }

        return type;
    }
}
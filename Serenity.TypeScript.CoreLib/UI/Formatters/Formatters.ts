namespace Serenity {
    import Formatter = Serenity.Decorators.registerFormatter
    import Option = Serenity.Decorators.option

    @Formatter('Serenity.BooleanFormatter')
    export class BooleanFormatter implements Slick.Formatter {
        format(ctx: Slick.FormatterContext) {

            if (ctx.value == null) {
                return '';
            }

            var text;
            if (!!ctx.value) {
                text = Q.tryGetText(this.trueText);
                if (text == null) {
                    text = this.trueText;
                    if (text == null) {
                        text = Q.coalesce(Q.tryGetText('Dialogs.YesButton'), 'Yes');
                    }
                }
            }
            else {
                text = Q.tryGetText(this.falseText);
                if (text == null) {
                    text = this.falseText;
                    if (text == null) {
                        text = Q.coalesce(Q.tryGetText('Dialogs.NoButton'), 'No');
                    }
                }
            }

            return Q.htmlEncode(text);
        }

        @Serenity.Decorators.option()
        public falseText: string;

        @Serenity.Decorators.option()
        public trueText: string;
    }

    @Formatter('Serenity.CheckboxFormatter')
    export class CheckboxFormatter implements Slick.Formatter {
        format(ctx: Slick.FormatterContext) {
            return '<span class="check-box no-float readonly ' + (!!ctx.value ? ' checked' : '') + '"></span>';
        }
    }

    @Formatter('Serenity.DateFormatter')
    export class DateFormatter implements Slick.Formatter {
        constructor() {
            this.set_displayFormat(Q.Culture.dateFormat);
        }

        static format(value: any, format?: string) {
            if (value == null) {
                return '';
            }

            var date: Date;

            if (value instanceof Date) {
                date = value;
            }
            else if (typeof value === 'string') {
                date = Q.parseISODateTime(value);

                if (date == null) {
                    return Q.htmlEncode(value);
                }
            }
            else {
                return value.toString();
            }

            return Q.htmlEncode(Q.formatDate(date, format));
        }

        private displayFormat: string;

        @Option()
        get_displayFormat(): string {
            return this.displayFormat;
        }

        set_displayFormat(value: string): void {
            this.displayFormat = value;
        }

        format(ctx: Slick.FormatterContext): string {
            return DateFormatter.format(ctx.value, this.get_displayFormat());
        }
    }

    @Formatter('Serenity.DateTimeFormatter')
    export class DateTimeFormatter extends DateFormatter {
        constructor() {
            super();

            this.set_displayFormat(Q.Culture.dateTimeFormat);
        }
    }
}

declare namespace Serenity {

    class EnumFormatter implements Slick.Formatter {
        format(ctx: Slick.FormatterContext): string;
        static format(enumType: Function, value: any): string;
        static getText(enumKey: string, name: string): string;
        static getText(value: any): string;
        static getName(value: any): string;
        get_enumKey(): string;
        set_enumKey(value: string): void;
    }

    class FileDownloadFormatter {
        format(ctx: Slick.FormatterContext): string;
        static dbFileUrl(filename: string): string;
        initializeColumn(column: Slick.Column): void;
        get_displayFormat(): string;
        set_displayFormat(value: string): void;
        get_originalNameProperty(): string;
        set_originalNameProperty(value: string): void;
    }

    class NumberFormatter {
        format(ctx: Slick.FormatterContext): string;
        static format(value: any, format: string): string;
        get_displayFormat(): string;
        set_displayFormat(value: string): void;
    }

    class MinuteFormatter implements Slick.Formatter {
        format(ctx: Slick.FormatterContext): string;
        static format(value: any): string;
    }

    class UrlFormatter implements Slick.Formatter {
        format(ctx: Slick.FormatterContext): string;
        get_displayProperty(): string;
        set_displayProperty(value: string): void;
        get_displayFormat(): string;
        set_displayFormat(value: string): void;
        get_urlProperty(): string;
        set_urlProperty(value: string): void;
        get_urlFormat(): string;
        set_urlFormat(value: string): void;
        get_target(): string;
        set_target(value: string): void;
    }

    namespace FormatterTypeRegistry {
        function get(key: string): Function;
        function initialize(): void;
        function reset(): void;
    }
}
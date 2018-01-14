namespace Serenity {

    @Decorators.registerClass('Serenity.DateFiltering')
    export class DateFiltering extends BaseEditorFiltering<DateEditor> {

        constructor() {
            super(DateEditor)
        }

        getOperators(): Serenity.FilterOperator[] {
            return this.appendNullableOperators(this.appendComparisonOperators([]));
        }
    }
}
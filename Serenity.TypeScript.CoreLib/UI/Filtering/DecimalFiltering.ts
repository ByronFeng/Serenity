namespace Serenity {

    @Decorators.registerClass('Serenity.DecimalFiltering')
    export class DecimalFiltering extends BaseEditorFiltering<DecimalEditor> {
        constructor() {
            super(DecimalEditor);
        }

        getOperators(): Serenity.FilterOperator[] {
            return this.appendNullableOperators(
                this.appendComparisonOperators([]));
        }
    }

}
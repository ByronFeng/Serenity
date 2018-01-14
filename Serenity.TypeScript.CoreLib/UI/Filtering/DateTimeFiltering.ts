namespace Serenity {

    @Decorators.registerClass('Serenity.DateTimeFiltering')
    export class DateTimeFiltering extends BaseEditorFiltering<DateEditor> {

        constructor() {
            super(DateTimeEditor)
        }

        getOperators(): Serenity.FilterOperator[] {
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

}
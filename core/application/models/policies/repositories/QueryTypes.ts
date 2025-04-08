export enum QueryConditionOperator {
  EQUALS = '=',
  LESS_THAN = '<',
  LESS_THAN_EQUALS = '<=',
  GREATER_THAN = '>',
  GREATER_THAN_EQUALS = '>=',
  BEGINS_WITH = 'begins_with',
  BETWEEN = 'BETWEEN'
}

export type QueryCondition<T extends Record<string, unknown>> = {
  attributeName: keyof T;
  operator: QueryConditionOperator;
  attributeValue: string | number;
  attributeValue2?: string | number;
}

export type QueryOptions = {
  indexName?: string;
  limit?: number;
  scanIndexForward?: boolean;
  exclusiveStartKey?: Record<string, unknown>;
  filterExpression?: string;
  filterExpressionValues?: Record<string, unknown>;
}

export type QueryInput<T extends Record<string, unknown>> = {
  partitionKeyCondition: QueryCondition<T>;
  sortKeyCondition?: QueryCondition<T>;
  options?: QueryOptions;
}

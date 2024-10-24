export enum QueryConditionOperator {
  EQUALS = '=',
  LESS_THAN = '<',
  LESS_THAN_EQUALS = '<=',
  GREATER_THAN = '>',
  GREATER_THAN_EQUALS = '>=',
  BEGINS_WITH = 'begins_with',
  BETWEEN = 'BETWEEN'
}

export interface QueryCondition {
  attributeName: string;
  operator: QueryConditionOperator;
  attributeValue: any;
  attributeValue2?: any; // For BETWEEN operator
}

export interface QueryOptions {
  indexName?: string;
  limit?: number;
  scanIndexForward?: boolean;
  exclusiveStartKey?: Record<string, any>;
  filterExpression?: string;
  filterExpressionValues?: Record<string, any>;
}

export interface QueryInput {
  partitionKeyCondition: QueryCondition;
  sortKeyCondition?: QueryCondition;
  options?: QueryOptions;
}

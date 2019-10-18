import { FieldDisplayOptions } from '@grafana/ui';

export interface TraceExemplarOptions {
  fieldOptions: FieldDisplayOptions;
  aggregations: AggregationOptions;
}

export interface AggregationOptions {
  maxSeries: number;
}

export const defaults: TraceExemplarOptions = {
  fieldOptions: {
    defaults: {},
    override: {},
    calcs: [],
  },
  aggregations: {
    maxSeries: 25,
  }
};

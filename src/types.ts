import { FieldDisplayOptions } from '@grafana/ui';

export interface TraceExemplarOptions {
  fieldOptions: FieldDisplayOptions;
  aggregations: AggregationOptions;
}

export interface AggregationOptions {
  maxSeries: number;
}

export interface ZipkinTraceFieldValue {
  timestamp: number;
  duration: number;
  link: string;
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

export interface Bucket {
  value: number;
  count: number;
  traceExemplar?: ZipkinTraceFieldValue;
}

export interface Timeslice {
  timestamp: number;
  buckets: Bucket[];
}

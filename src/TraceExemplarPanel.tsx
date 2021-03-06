import React from 'react';
import { PanelProps, PanelData } from '@grafana/ui';
import { DataFrameDTO, FieldDTO } from '@grafana/data';
import { Heatmap } from './Heatmap';

import { Timeslice, TraceExemplarOptions } from './types';

interface TraceExemplarPanelProps extends PanelProps<TraceExemplarOptions> {}

interface PrometheusDataFrame extends DataFrameDTO {
  fields: FieldDTO[];
  rows: number[][];
}

const EMPTY_PANEL = (
  <div className="panel-empty">
    <p>No data found in response</p>
  </div>
);

export const TraceExemplarPanel: React.FunctionComponent<TraceExemplarPanelProps> = ({
  data,
  timeRange,
  timeZone,
  width,
  height,
  options,
}) => {
  if (!data) {
    return EMPTY_PANEL;
  }

  const prometheusToHeatmap = (data: PanelData): Timeslice[] =>
    data.series.length === 0 || !((data.series[0] as DataFrameDTO) as PrometheusDataFrame).rows ? [] :
    ((data.series[0] as DataFrameDTO) as PrometheusDataFrame).rows.map(([ _, ts], index) => {
      const buckets = ((data.series as DataFrameDTO[]) as PrometheusDataFrame[])
      .filter(series => series.rows && series.rows[index][0] !== null)
      .map(series => ({
        value: series.fields[0].name === '+Inf' ? Infinity : +series.fields[0].name,
        count: series.rows[index][0]
      }))
      .sort((bucket1, bucket2) => bucket1.value - bucket2.value);

      // cumulative to normal histogram
      for (let i = buckets.length-1; i > 0; i--) {
        buckets[i].count -= buckets[i-1].count;
      }

      return {
        timestamp: ts,
        buckets: buckets,
      };
    });

  const aggregateTimeSeries = (timeslices: Timeslice[]): Timeslice[] => {
    const maxSeries = options.aggregations.maxSeries || 100;
    const slicesToAggregate = Math.ceil(timeslices.length / maxSeries);

    return timeslices.reduce((aggregatedTimeslices, cur, index) => {
      if (index % slicesToAggregate === 0) {
        aggregatedTimeslices.push({ timestamp: cur.timestamp, buckets: cur.buckets });
      } else {
        aggregatedTimeslices[aggregatedTimeslices.length-1].buckets.forEach((bucket, i) => {
          if (!cur.buckets[i]) {
            return;
          }

          const curCount = cur.buckets[i].count;
          if (curCount !== null) {
            if (bucket.count === null) {
              bucket.count = curCount;
            } else {
              bucket.count += curCount;
            }
          }
        });
      }
      return aggregatedTimeslices;
    }, new Array<Timeslice>());
  };

  const timeslices = aggregateTimeSeries(prometheusToHeatmap(data));

  const traceExemplars = data.series
    .filter(series => series.labels && series.labels.dataType === 'zipkin')
    .flatMap(series => (series.fields[0] as FieldDTO).values)
    .sort((a, b) => a.timestamp - b.timestamp);

  let minimumTime = timeRange.from.unix() * 1000;
  if (traceExemplars.length > 0) {
    let traceExemplarIndex = 0;

    assignTraceExemplars: for (const timeslice of timeslices) {
      while (traceExemplars[traceExemplarIndex].timestamp <= timeslice.timestamp &&
        traceExemplars[traceExemplarIndex].timestamp >= minimumTime) {
        const traceExemplar = traceExemplars[traceExemplarIndex++];
        const bucket = timeslice.buckets.find(bucket => traceExemplar.durationSeconds <= bucket.value);
        if (bucket) {
          bucket.traceExemplar = traceExemplar;
        }
        if (traceExemplarIndex > traceExemplars.length - 1) {
          break assignTraceExemplars;
        }
      }
      minimumTime = timeslice.timestamp;
    }
  }

  if (timeslices.length === 0) {
    return EMPTY_PANEL;
  }

  return (
    <Heatmap
      width={width}
      height={height}
      timeslices={timeslices}
      dark={false}
      units={options.fieldOptions.defaults.unit}
      decimals={options.fieldOptions.defaults.decimals || 2}
      minBucket={options.fieldOptions.defaults.min || 0}
      maxBucket={options.fieldOptions.defaults.max || Infinity}
      timezone={timeZone}
    />
  );
};

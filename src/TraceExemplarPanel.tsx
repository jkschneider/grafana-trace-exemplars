import React from 'react';
import { PanelProps, PanelData } from '@grafana/ui';
import { DataFrame, Field } from '@grafana/data';
import { Heatmap, Timeslice } from './Heatmap';

import { TraceExemplarOptions } from './types';

interface TraceExemplarPanelProps extends PanelProps<TraceExemplarOptions> {}

interface PrometheusDataFrame extends DataFrame {
  fields: Field[];
  rows: number[][];
}

export const TraceExemplarPanel: React.FunctionComponent<TraceExemplarPanelProps> = ({
  data,
  // @ts-ignore
  timeRange,
  timeZone,
  width,
  height,
  options,
}) => {
  if (!data) {
    return (
      <div className="panel-empty">
        <p>No data found in response</p>
      </div>
    );
  }

  const prometheusToHeatmap = (data: PanelData): Timeslice[] =>
    data.series.length === 0 ? [] :
    (data.series[0] as PrometheusDataFrame).rows.map(([ _, ts], index) => {
      const buckets = (data.series as PrometheusDataFrame[])
      .filter(series => series.rows[index][0] !== null)
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

  return (
    <Heatmap
      width={width}
      height={height}
      timeslices={aggregateTimeSeries(prometheusToHeatmap(data))}
      dark={false}
      units={options.fieldOptions.defaults.unit}
      decimals={options.fieldOptions.defaults.decimals || 2}
      minBucket={options.fieldOptions.defaults.min || 0}
      maxBucket={options.fieldOptions.defaults.max || Infinity}
      timezone={timeZone}
    />
  );
};

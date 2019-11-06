import * as d3 from 'd3';
import * as d3ScaleChromatic from 'd3-scale-chromatic';
import React from 'react';
import { getValueFormat } from '@grafana/ui';
import classNames from 'classnames';

import './Heatmap.css';
import { timeFormat as grafanaTimeFormat } from './timeFormat';

export interface Bucket {
  value: number;
  count: number;
  trace?: string;
}

export interface Timeslice {
  timestamp: number;
  buckets: Bucket[];
}

export interface HeatmapProps {
  timeslices: Timeslice[];
  timezone: string; // TODO comes from dashboard.getTimezone()?
  width: number;
  height: number;
  units: string;
  decimals: number;
  minBucket: number;
  maxBucket: number;
  dark: boolean;
}

const
  MAX_TRACE_MARKER_RADIUS = 8,
  Y_AXIS_WIDTH = 100,
  Y_TICK_SIZE_PX = 16,
  X_AXIS_HEIGHT = 30,
  X_TICK_SIZE_PX = 100;

const mapNumber = <T extends any>(N: number, mapping: (index: number) => T): T[] => {
  const mapped = new Array<T>();
  for (let i = 0; i < N; i++) {
    mapped.push(mapping(i));
  }
  return mapped;
};

export function Heatmap(props: HeatmapProps) {
  const width = props.width - Y_AXIS_WIDTH;
  const height = props.height - X_AXIS_HEIGHT;

  const bucketFilter = (bucket: Bucket) => bucket.value >= props.minBucket && bucket.value <= props.maxBucket;

  const maxValue = Math.max(...props.timeslices.flatMap(timeslice => timeslice.buckets
    .filter(bucketFilter)
    .map(bucket => bucket.count)));
  const minTime = props.timeslices.length > 0 ? props.timeslices[0].timestamp : 0;
  const maxTime = props.timeslices.length > 0 ? props.timeslices[props.timeslices.length - 1].timestamp : 0;

  // timeslice index with the most buckets
  const maxBucketTimesliceIndex = props.timeslices.reduce(
    (acc, cur, index) => {
      const filteredBuckets = cur.buckets.filter(bucketFilter);
      return filteredBuckets.length > acc.bucketLength ? { index: index, bucketLength: filteredBuckets.length } : acc;
    },
    { index: -1, bucketLength: -1 }
  ).index;

  const bucketRange = props.timeslices[maxBucketTimesliceIndex].buckets.filter(bucketFilter);

  const colorScale = d3.scaleSequential(d3ScaleChromatic.interpolateSpectral)
    .domain([maxValue, 0]);

  const bucketHeight = props.timeslices.length > 0 ? height / bucketRange.length : 0;
  const bucketWidth = width / props.timeslices.length;

  // x-axis settings
  //  const xTicks = width / (Math.ceil(X_TICK_SIZE_PX / bucketWidth) * bucketWidth);
  const xTicks = Math.floor(props.timeslices.length / Math.ceil(X_TICK_SIZE_PX / bucketWidth));
  const xTickIndexIncrement = Math.floor((props.timeslices.length - 1) / (xTicks - 1));
  const chartTimeFormat = grafanaTimeFormat(xTicks, minTime, maxTime);

  // FIXME offset for custom timezones
  const xAxisFormat = props.timezone === 'utc' ?
    d3.utcFormat(chartTimeFormat) : d3.timeFormat(chartTimeFormat);

  // y-axis settings
  const yTicks = Math.floor(bucketRange.length / Math.ceil(Y_TICK_SIZE_PX / bucketHeight));
  const yTickIndexIncrement = Math.floor((bucketRange.length - 1) / (yTicks - 1));
  const yAxisFormat = (bucket: number) =>
   bucket === Infinity ? '+Inf' : getValueFormat(props.units || 'none')(bucket, props.decimals);

  return (
    <svg
      className={classNames('heatmap', { dark: props.dark })}
      viewBox={`0 0 ${props.width} ${props.height}`}>
      <g>
        {// y-axis
        maxBucketTimesliceIndex > -1 &&
          mapNumber(yTicks, tick => {
            const lastTick = tick === yTicks - 1;
            const index = lastTick ? bucketRange.length - 1 : tick * yTickIndexIncrement;
            const bucket = bucketRange[index];
            const y = height - index * bucketHeight - (lastTick ? bucketHeight : bucketHeight / 2);
            return (
              <text
                key={`yaxis-${tick}`}
                className={classNames('axis', { dark: props.dark })}
                textAnchor={'end'}
                alignmentBaseline={lastTick ? 'hanging' : 'middle'}
                x={Y_AXIS_WIDTH - 10}
                y={y}
              >
                {yAxisFormat(bucket.value)}
              </text>
            );
          })}
      </g>
      <g>
        {// x-axis
        maxBucketTimesliceIndex > -1 &&
          mapNumber(xTicks, tick => {
            const index = tick * xTickIndexIncrement;
            const lastTick = tick === xTicks - 1;
            return (
              <text
                key={`xaxis-${tick}`}
                className={classNames('axis', { dark: props.dark })}
                textAnchor={lastTick ? 'end' : 'middle'}
                x={Y_AXIS_WIDTH + index * bucketWidth + (lastTick ? bucketWidth : bucketWidth / 2)}
                y={props.height - 10}
              >
                {xAxisFormat(props.timeslices[index].timestamp)}
              </text>
            );
          })}
      </g>
      <g>
        {// horizontal grid
        maxBucketTimesliceIndex > -1 &&
          mapNumber(bucketRange.length + 1, bucketIndex => (
            <line
              key={`hgrid-${bucketIndex}`}
              x1={Y_AXIS_WIDTH}
              x2={props.width}
              y1={bucketIndex * bucketHeight}
              y2={bucketIndex * bucketHeight}
              className={classNames('grid-line', { dark: props.dark })}
            />
          ))}
      </g>
      <g>
        {// vertical grid
        mapNumber(props.timeslices.length + 1, timesliceIndex => {
          const x = Y_AXIS_WIDTH + (timesliceIndex * bucketWidth);
          return (
            <line
              key={`vgrid-${timesliceIndex}`}
              x1={x}
              x2={x}
              y1={0}
              y2={height}
              className={classNames('grid-line', { dark: props.dark })}
            />
          );
        })}
      </g>
      <g>
        {// colored heatmap cells
        props.timeslices.flatMap((timeslice, timesliceIndex) =>
          timeslice.buckets.filter(bucketFilter).map((bucket, bucketIndex) => {
            const x = timesliceIndex * bucketWidth + Y_AXIS_WIDTH;
            const y = (bucketRange.length - bucketIndex - 1) * bucketHeight;

            const bucketHeatFill = bucket.count === 0 ? {} :
              { fill: colorScale(bucket.count) };

            const bucketHeatRect = (
              <rect
                className={classNames('heatmap-bucket', { dark: props.dark })}
                width={bucketWidth}
                height={bucketHeight}
                x={x}
                y={y}
                style={bucketHeatFill}
              />
            );

            return (
              <g key={`${timesliceIndex},${bucketIndex}`}>
                {!!bucket.trace ? (
                  <a href={bucket.trace} target={'_blank'}>
                    <g>
                      {bucketHeatRect}
                      <circle
                        className={'trace-marker'}
                        cx={x + bucketWidth / 2}
                        cy={y + bucketHeight / 2}
                        r={Math.min(MAX_TRACE_MARKER_RADIUS, (Math.min(bucketWidth, bucketHeight) * 0.8) / 2)}
                      />
                    </g>
                  </a>
                ) : (
                  bucketHeatRect
                )}
              </g>
            );
          })
        )}
      </g>
    </svg>
  );
}

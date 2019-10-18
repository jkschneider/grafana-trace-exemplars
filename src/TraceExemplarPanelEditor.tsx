import React, { PureComponent } from 'react';

import { FieldConfig } from '@grafana/data';
import {
  PanelEditorProps,
  PanelOptionsGrid,
  PanelOptionsGroup,
  FieldDisplayOptions,
  FieldPropertiesEditor,
  Input,
} from '@grafana/ui';

import { TraceExemplarOptions, AggregationOptions } from './types';

export class TraceExemplarPanelEditor extends PureComponent<PanelEditorProps<TraceExemplarOptions>> {
  onDisplayOptionsChanged = (fieldOptions: FieldDisplayOptions) =>
    this.props.onOptionsChange({
      ...this.props.options,
      fieldOptions,
    });

  onDefaultsChange = (field: Partial<FieldConfig>) => {
    this.onDisplayOptionsChanged({
      ...this.props.options.fieldOptions,
      defaults: field,
    });
  };

  onAggregationOptionsChange = (options: AggregationOptions) => {
    this.props.onOptionsChange({
      ...this.props.options,
      aggregations: options
    });
  };

  render() {
    const { options } = this.props;
    const { fieldOptions } = options;
    const { defaults } = fieldOptions;

    return (
      <>
        <PanelOptionsGrid>
          <PanelOptionsGroup title="Y-Axis">
            <FieldPropertiesEditor
              showMinMax={true}
              onChange={this.onDefaultsChange}
              value={defaults}/>
          </PanelOptionsGroup>
          <PanelOptionsGroup title="Aggregation">
            <div className="section gf-form-group">
              <h4>Time Domain</h4>
              <div className="gf-form">
                <div className="gf-form-label">Max Series</div>
                <Input
                  className="gf-form-input width-5"
                  type="number"
                  value={options.aggregations.maxSeries}
                  placeholder="Auto"
                  onChange={event => {
                    this.onAggregationOptionsChange({
                      ...options,
                      maxSeries: parseInt(event.target.value, 10),
                    });
                  }}
                />
              </div>
            </div>
          </PanelOptionsGroup>
        </PanelOptionsGrid>
      </>
    );
  }
}

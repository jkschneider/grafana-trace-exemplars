import { PanelPlugin } from '@grafana/ui';

import { TraceExemplarPanel } from './TraceExemplarPanel';
import { TraceExemplarPanelEditor } from './TraceExemplarPanelEditor';
import { defaults } from './types';

export const plugin = new PanelPlugin(TraceExemplarPanel)
  .setDefaults(defaults)
  .setEditor(TraceExemplarPanelEditor);

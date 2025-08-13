import React from 'react';
import { createRoot } from 'react-dom/client';

import ListApp from './ListApp';
import RecordApp from './RecordApp';

kintone.events.on(
  ['app.record.index.show', 'mobile.app.record.index.show'],
  (ev) => {
    if (`${ev.viewId}` === process.env.KINTONE_VIEW_ID) {
      const root = createRoot(kintone.app.getHeaderSpaceElement()!);
      root.render(<ListApp appId={ev.appId} records={ev.records} />);
    }

    return ev;
  }
);

kintone.events.on(
  ['app.record.detail.show', 'mobile.app.record.detail.show'],
  (ev) => {
    const root = createRoot(kintone.app.record.getSpaceElement('space')!);
    root.render(
      <RecordApp appId={ev.appId} recordId={ev.recordId} record={ev.record} />
    );

    return ev;
  }
);

import React from 'react';
import { createRoot } from 'react-dom/client';

import ListView from './ListView';

kintone.events.on([
  'app.record.index.show',
  'mobile.app.record.index.show',
], (ev) => {
  if (`${ev.viewId}` === process.env.KINTONE_VIEW_ID) {
    const root = createRoot(kintone.app.getHeaderSpaceElement());
    root.render(<ListView appId={ev.appId} records={ev.records} />);
  }

  return ev;
});

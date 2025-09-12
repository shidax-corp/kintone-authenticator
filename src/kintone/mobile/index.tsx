import React from 'react';
import { createRoot } from 'react-dom/client';

import GlobalStyle from '@components/GlobalStyle';

kintone.events.on('mobile.app.record.index.show', (ev) => {
  if (`${ev.viewId}` === process.env.KINTONE_VIEW_ID) {
    const root = createRoot(kintone.app.getHeaderSpaceElement()!);
    root.render(<GlobalStyle>list</GlobalStyle>);
  }

  return ev;
});

kintone.events.on('mobile.app.record.detail.show', (ev) => {
  const root = createRoot(kintone.app.record.getSpaceElement('space')!);
  root.render(<GlobalStyle tint>detail</GlobalStyle>);

  return ev;
});

kintone.events.on(
  'mobile.app.record.create.show',
  (ev: kintone.events.RecordCreateShowEvent) => {
    const root = createRoot(kintone.app.record.getSpaceElement('space')!);
    root.render(<GlobalStyle tint>create</GlobalStyle>);

    return ev;
  }
);

kintone.events.on(
  'mobile.app.record.edit.show',
  (ev: kintone.events.RecordEditShowEvent) => {
    const root = createRoot(kintone.app.record.getSpaceElement('space')!);
    root.render(<GlobalStyle>edit</GlobalStyle>);

    return ev;
  }
);

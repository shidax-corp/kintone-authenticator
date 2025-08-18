import React from 'react';
import { createRoot } from 'react-dom/client';

import GlobalStyle from '@components/GlobalStyle';

import DetailApp from './DetailApp';
import FormApp from './FormApp';
import ListApp from './ListApp';

kintone.events.on(
  ['app.record.index.show', 'mobile.app.record.index.show'],
  (ev) => {
    if (`${ev.viewId}` === process.env.KINTONE_VIEW_ID) {
      const root = createRoot(kintone.app.getHeaderSpaceElement()!);
      root.render(
        <GlobalStyle>
          <ListApp appId={ev.appId} viewId={ev.viewId} records={ev.records} />
        </GlobalStyle>
      );
    }

    return ev;
  }
);

kintone.events.on(
  ['app.record.detail.show', 'mobile.app.record.detail.show'],
  (ev) => {
    const root = createRoot(kintone.app.record.getSpaceElement('space')!);
    root.render(
      <GlobalStyle tint>
        <DetailApp record={ev.record} />
      </GlobalStyle>
    );

    return ev;
  }
);

kintone.events.on(
  ['app.record.create.show', 'mobile.app.record.create.show'],
  (ev: kintone.events.RecordCreateShowEvent) => {
    const root = createRoot(kintone.app.record.getSpaceElement('space')!);
    root.render(
      <GlobalStyle tint>
        <FormApp record={kintone.app.record.get().record} />
      </GlobalStyle>
    );

    return ev;
  }
);

kintone.events.on(
  ['app.record.edit.show', 'mobile.app.record.edit.show'],
  (ev: kintone.events.RecordEditShowEvent) => {
    const root = createRoot(kintone.app.record.getSpaceElement('space')!);
    root.render(
      <GlobalStyle>
        <FormApp record={ev.record} />
      </GlobalStyle>
    );

    return ev;
  }
);

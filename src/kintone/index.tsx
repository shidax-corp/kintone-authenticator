import React from 'react';
import { createRoot } from 'react-dom/client';

import ListApp from './ListApp';
import RecordApp from './RecordApp';
import FormApp from './FormApp';
import { validateKintoneRecord } from './lib/validation';

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

kintone.events.on(
  ['app.record.create.show', 'mobile.app.record.create.show'],
  (ev: kintone.events.RecordCreateShowEvent) => {
    const root = createRoot(kintone.app.record.getSpaceElement('space')!);
    root.render(<FormApp appId={ev.appId} mode="create" />);

    return ev;
  }
);

kintone.events.on(
  ['app.record.edit.show', 'mobile.app.record.edit.show'],
  (ev: kintone.events.RecordEditShowEvent) => {
    const root = createRoot(kintone.app.record.getSpaceElement('space')!);
    root.render(
      <FormApp
        appId={ev.appId}
        recordId={ev.recordId}
        record={ev.record}
        mode="edit"
      />
    );

    return ev;
  }
);

kintone.events.on(
  ['app.record.create.submit', 'mobile.app.record.create.submit'],
  (ev: kintone.events.RecordCreateSubmitEvent) => {
    const errors = validateKintoneRecord(ev.record);

    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, error]) => {
        if (error && ev.record[field as keyof kintone.types.Fields]) {
          (ev.record[field as keyof kintone.types.Fields] as any).error = error;
        }
      });
    }

    return ev;
  }
);

kintone.events.on(
  ['app.record.edit.submit', 'mobile.app.record.edit.submit'],
  (ev: kintone.events.RecordEditSubmitEvent) => {
    const errors = validateKintoneRecord(ev.record);

    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, error]) => {
        if (error && ev.record[field as keyof kintone.types.Fields]) {
          (ev.record[field as keyof kintone.types.Fields] as any).error = error;
        }
      });
    }

    return ev;
  }
);

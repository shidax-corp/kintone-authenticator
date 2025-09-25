import Renderer from '../lib/renderer';
import DetailApp from './DetailApp';
import FormApp from './FormApp';
import ListApp from './ListApp';

const renderer = new Renderer();

kintone.events.on('mobile.app.record.index.show', (ev) => {
  const container = document.getElementById('kintone-authenticator-list-view');
  if (container) {
    renderer.render(
      container,
      <ListApp appId={ev.appId} viewId={ev.viewId} records={ev.records} />
    );
  }

  return ev;
});

kintone.events.on('mobile.app.record.detail.show', (ev) => {
  renderer.render(
    kintone.mobile.app.record.getSpaceElement('space')!,
    <DetailApp record={ev.record} />
  );

  return ev;
});

kintone.events.on(
  'mobile.app.record.create.show',
  (ev: kintone.events.RecordCreateShowEvent) => {
    renderer.render(
      kintone.mobile.app.record.getSpaceElement('space')!,
      <FormApp />
    );

    return ev;
  }
);

kintone.events.on(
  'mobile.app.record.edit.show',
  (ev: kintone.events.RecordEditShowEvent) => {
    renderer.render(
      kintone.mobile.app.record.getSpaceElement('space')!,
      <FormApp initialURI={ev.record.otpuri.value} />
    );

    return ev;
  }
);

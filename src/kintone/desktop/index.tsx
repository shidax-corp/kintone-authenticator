import Renderer from '../lib/renderer';
import DetailApp from './DetailApp';
import FormApp from './FormApp';
import ListApp from './ListApp';

const renderer = new Renderer();

kintone.events.on('app.record.index.show', (ev) => {
  const container = document.getElementById('kintone-authenticator-list-view');
  if (container) {
    renderer.render(
      container,
      <ListApp appId={ev.appId} viewId={ev.viewId} records={ev.records} />
    );
  }

  return ev;
});

kintone.events.on('app.record.detail.show', (ev) => {
  renderer.render(
    kintone.app.record.getSpaceElement('space')!,
    <DetailApp record={ev.record} />,
    { tint: true }
  );

  return ev;
});

kintone.events.on(
  'app.record.create.show',
  (ev: kintone.events.RecordCreateShowEvent) => {
    renderer.render(
      kintone.app.record.getSpaceElement('space')!,
      <FormApp record={ev.record} />,
      { tint: true }
    );

    return ev;
  }
);

kintone.events.on(
  'app.record.edit.show',
  (ev: kintone.events.RecordEditShowEvent) => {
    renderer.render(
      kintone.app.record.getSpaceElement('space')!,
      <FormApp record={ev.record} />,
      { tint: true }
    );

    return ev;
  }
);

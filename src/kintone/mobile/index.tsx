import Renderer from '../lib/renderer';
import FormApp from './FormApp';

const renderer = new Renderer();

kintone.events.on('mobile.app.record.index.show', (ev) => {
  if (`${ev.viewId}` === process.env.KINTONE_VIEW_ID) {
    renderer.render(
      kintone.mobile.app.getHeaderSpaceElement()!,
      <div>list</div>
    );
  }

  return ev;
});

kintone.events.on('mobile.app.record.detail.show', (ev) => {
  renderer.render(
    kintone.mobile.app.record.getSpaceElement('space')!,
    <div>detail</div>
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

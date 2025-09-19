import Renderer from '../lib/renderer';
import CreateApp from './CreateApp';

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
    <div>detail</div>,
    { tint: true }
  );

  return ev;
});

kintone.events.on(
  'mobile.app.record.create.show',
  (ev: kintone.events.RecordCreateShowEvent) => {
    renderer.render(
      kintone.mobile.app.record.getSpaceElement('space')!,
      <CreateApp />,
      { tint: true }
    );

    return ev;
  }
);

kintone.events.on(
  'mobile.app.record.edit.show',
  (ev: kintone.events.RecordEditShowEvent) => {
    renderer.render(
      kintone.mobile.app.record.getSpaceElement('space')!,
      <div>edit</div>,
      { tint: true }
    );

    return ev;
  }
);

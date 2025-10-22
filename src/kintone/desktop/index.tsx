import Keychain from '@components/Keychain';

import Renderer from '../lib/renderer';
import DetailApp from './DetailApp';
import FormApp from './FormApp';
import ListApp from './ListApp';
import PasscodeDialog from './components/PasscodeDialog';

const renderer = new Renderer();

kintone.events.on('app.record.index.show', (ev) => {
  const container = document.getElementById('kintone-authenticator-list-view');
  if (container) {
    renderer.render(
      container,
      <Keychain prompt={PasscodeDialog}>
        <ListApp appId={ev.appId} viewId={ev.viewId} records={ev.records} />
      </Keychain>
    );
  }

  return ev;
});

kintone.events.on('app.record.detail.show', (ev) => {
  renderer.render(
    kintone.app.record.getSpaceElement('space')!,
    <Keychain prompt={PasscodeDialog}>
      <DetailApp record={ev.record} />
    </Keychain>,
    { tint: true }
  );

  return ev;
});

kintone.events.on(
  'app.record.create.show',
  (ev: kintone.events.RecordCreateShowEvent) => {
    renderer.render(
      kintone.app.record.getSpaceElement('space')!,
      <Keychain prompt={PasscodeDialog}>
        <FormApp record={ev.record} />
      </Keychain>,
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
      <Keychain prompt={PasscodeDialog}>
        <FormApp record={ev.record} />
      </Keychain>,
      { tint: true }
    );

    return ev;
  }
);

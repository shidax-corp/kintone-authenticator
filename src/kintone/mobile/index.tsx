import Keychain from '@components/Keychain';

import Renderer from '../lib/renderer';
import DetailApp from './DetailApp';
import FormApp from './FormApp';
import ListApp from './ListApp';
import PasscodePrompt from './components/PasscodePrompt';

const renderer = new Renderer();

kintone.events.on('mobile.app.record.index.show', (ev) => {
  const container = document.getElementById('kintone-authenticator-list-view');
  if (container) {
    renderer.render(
      container,
      <Keychain prompt={PasscodePrompt}>
        <ListApp appId={ev.appId} viewId={ev.viewId} records={ev.records} />
      </Keychain>
    );
  }

  return ev;
});

kintone.events.on('mobile.app.record.detail.show', (ev) => {
  renderer.render(
    kintone.mobile.app.record.getSpaceElement('space')!,
    <Keychain prompt={PasscodePrompt}>
      <DetailApp record={ev.record} />
    </Keychain>
  );

  return ev;
});

kintone.events.on(
  'mobile.app.record.create.show',
  (ev: kintone.events.RecordCreateShowEvent) => {
    renderer.render(
      kintone.mobile.app.record.getSpaceElement('space')!,
      <Keychain prompt={PasscodePrompt}>
        <FormApp />
      </Keychain>
    );

    return ev;
  }
);

kintone.events.on(
  'mobile.app.record.edit.show',
  (ev: kintone.events.RecordEditShowEvent) => {
    renderer.render(
      kintone.mobile.app.record.getSpaceElement('space')!,
      <Keychain prompt={PasscodePrompt}>
        <FormApp record={ev.record} />
      </Keychain>
    );

    return ev;
  }
);

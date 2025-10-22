import '@testing-library/jest-dom';
import { act, fireEvent, render } from '@testing-library/react';

import PasscodeDialog from './PasscodeDialog';

describe('PasscodeDialog', () => {
  let resolveShow: ((value: 'OK' | 'CANCEL') => void) | null;
  let dialogBody: HTMLElement | null;

  beforeEach(() => {
    resolveShow = null;
    dialogBody = null;
    const close = jest.fn();
    const show = jest
      .fn()
      .mockImplementation(
        () =>
          new Promise<'OK' | 'CANCEL'>((resolve) => {
            resolveShow = resolve;
          })
      );

    (globalThis as any).kintone = {
      createDialog: jest.fn().mockImplementation(({ body }: { body: HTMLElement }) => {
        dialogBody = body;
        document.body.appendChild(body);
        return Promise.resolve({
          show,
          close,
        });
      }),
    };
  });

  afterEach(() => {
    dialogBody?.remove();
  });

  it('passes the latest passcode to callback even when confirmed immediately', async () => {
    const callback = jest.fn();

    render(<PasscodeDialog callback={callback} />);

    // Wait for createDialog promise and initial show call.
    await act(async () => {
      await Promise.resolve();
    });

    expect(dialogBody).not.toBeNull();
    const input = dialogBody!.querySelector('input') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: '1234' } });

    await act(async () => {
      resolveShow?.('OK');
    });

    expect(callback).toHaveBeenCalledWith('1234');
  });
});

import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import PasscodeDialog from './PasscodeDialog';

describe('PasscodeDialog', () => {
  let beforeCloseHandler:
    | ((action: 'OK' | 'CANCEL' | 'CLOSE') => Promise<boolean>)
    | null;
  let dialogBody: HTMLElement | null;
  let closeMock: jest.Mock;

  beforeEach(() => {
    beforeCloseHandler = null;
    dialogBody = null;
    closeMock = jest.fn();
    const showMock = jest.fn();

    (globalThis as any).kintone = {
      createDialog: jest
        .fn()
        .mockImplementation(
          ({
            body,
            beforeClose,
          }: {
            body: HTMLElement;
            beforeClose: (
              action: 'OK' | 'CANCEL' | 'CLOSE'
            ) => Promise<boolean>;
          }) => {
            dialogBody = body;
            beforeCloseHandler = beforeClose;
            document.body.appendChild(body);
            return Promise.resolve({
              show: showMock,
              close: closeMock,
            });
          }
        ),
    };
  });

  afterEach(() => {
    dialogBody?.remove();
  });

  it('passes the latest passcode to callback even when confirmed immediately', async () => {
    const callback = jest.fn();

    render(<PasscodeDialog shown={true} callback={callback} />);

    // Wait for createDialog promise and initial show call.
    await act(async () => {
      await Promise.resolve();
    });

    expect(dialogBody).not.toBeNull();
    const input = dialogBody!.querySelector('input') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: '1234' } });

    const result = await act(async () => {
      return await beforeCloseHandler?.('OK');
    });

    expect(result).toBe(true);
    expect(callback).toHaveBeenCalledWith('1234');
  });

  it('shows error when passcode is empty', async () => {
    const callback = jest.fn();

    render(<PasscodeDialog shown={true} callback={callback} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(dialogBody).not.toBeNull();

    const result = await act(async () => {
      return await beforeCloseHandler?.('OK');
    });

    expect(result).toBe(false);
    expect(callback).not.toHaveBeenCalled();
    expect(closeMock).not.toHaveBeenCalled();
    expect(
      screen.getByText('パスコードを入力してください。')
    ).toBeInTheDocument();
  });

  it('shows error when passcode is only whitespace', async () => {
    const callback = jest.fn();

    render(<PasscodeDialog shown={true} callback={callback} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(dialogBody).not.toBeNull();
    const input = dialogBody!.querySelector('input') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: '   ' } });

    const result = await act(async () => {
      return await beforeCloseHandler?.('OK');
    });

    expect(result).toBe(false);
    expect(callback).not.toHaveBeenCalled();
    expect(closeMock).not.toHaveBeenCalled();
    expect(
      screen.getByText('パスコードを入力してください。')
    ).toBeInTheDocument();
  });

  it('shows error when callback throws synchronous error', async () => {
    const callback = jest.fn().mockImplementation(() => {
      throw new Error('Invalid passcode');
    });

    render(<PasscodeDialog shown={true} callback={callback} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(dialogBody).not.toBeNull();
    const input = dialogBody!.querySelector('input') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: '1234' } });

    const result = await act(async () => {
      return await beforeCloseHandler?.('OK');
    });

    expect(result).toBe(false);
    expect(callback).toHaveBeenCalledWith('1234');
    expect(closeMock).not.toHaveBeenCalled();
    expect(screen.getByText('Invalid passcode')).toBeInTheDocument();
  });

  it('shows error when callback rejects with async error', async () => {
    const callback = jest.fn().mockRejectedValue(new Error('Network error'));

    render(<PasscodeDialog shown={true} callback={callback} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(dialogBody).not.toBeNull();
    const input = dialogBody!.querySelector('input') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: '1234' } });

    const result = await act(async () => {
      return await beforeCloseHandler?.('OK');
    });

    expect(result).toBe(false);
    expect(callback).toHaveBeenCalledWith('1234');
    expect(closeMock).not.toHaveBeenCalled();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('shows error message when callback throws non-Error object', async () => {
    const callback = jest.fn().mockImplementation(() => {
      throw 'String error';
    });

    render(<PasscodeDialog shown={true} callback={callback} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(dialogBody).not.toBeNull();
    const input = dialogBody!.querySelector('input') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: '1234' } });

    const result = await act(async () => {
      return await beforeCloseHandler?.('OK');
    });

    expect(result).toBe(false);
    expect(closeMock).not.toHaveBeenCalled();
    expect(screen.getByText('String error')).toBeInTheDocument();
  });

  it('closes dialog when callback succeeds synchronously', async () => {
    const callback = jest.fn();

    render(<PasscodeDialog shown={true} callback={callback} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(dialogBody).not.toBeNull();
    const input = dialogBody!.querySelector('input') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: '1234' } });

    const result = await act(async () => {
      return await beforeCloseHandler?.('OK');
    });

    expect(result).toBe(true);
    expect(callback).toHaveBeenCalledWith('1234');
  });

  it('closes dialog when callback succeeds asynchronously', async () => {
    const callback = jest.fn().mockResolvedValue(undefined);

    render(<PasscodeDialog shown={true} callback={callback} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(dialogBody).not.toBeNull();
    const input = dialogBody!.querySelector('input') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: '1234' } });

    const result = await act(async () => {
      return await beforeCloseHandler?.('OK');
    });

    expect(result).toBe(true);
    expect(callback).toHaveBeenCalledWith('1234');
  });

  it('calls callback with null when cancelled', async () => {
    const callback = jest.fn();

    render(<PasscodeDialog shown={true} callback={callback} />);

    await act(async () => {
      await Promise.resolve();
    });

    const result = await act(async () => {
      return await beforeCloseHandler?.('CANCEL');
    });

    expect(result).toBe(true);
    expect(callback).toHaveBeenCalledWith(null);
  });

  it('calls callback with null when closed', async () => {
    const callback = jest.fn();

    render(<PasscodeDialog shown={true} callback={callback} />);

    await act(async () => {
      await Promise.resolve();
    });

    const result = await act(async () => {
      return await beforeCloseHandler?.('CLOSE');
    });

    expect(result).toBe(true);
    expect(callback).toHaveBeenCalledWith(null);
  });

  it('submits form with Enter key and closes dialog on success', async () => {
    const callback = jest.fn();

    render(<PasscodeDialog shown={true} callback={callback} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(dialogBody).not.toBeNull();
    const input = dialogBody!.querySelector('input') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: '5678' } });

    const form = dialogBody!.querySelector('form') as HTMLFormElement | null;
    expect(form).not.toBeNull();

    await act(async () => {
      fireEvent.submit(form!);
      // Wait for handleClose promise to resolve
      await Promise.resolve();
    });

    expect(callback).toHaveBeenCalledWith('5678');
    expect(closeMock).toHaveBeenCalled();
  });

  it('submits form but does not close dialog when callback throws error', async () => {
    const callback = jest.fn().mockImplementation(() => {
      throw new Error('Form error');
    });

    render(<PasscodeDialog shown={true} callback={callback} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(dialogBody).not.toBeNull();
    const input = dialogBody!.querySelector('input') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { value: '5678' } });

    const form = dialogBody!.querySelector('form') as HTMLFormElement | null;
    expect(form).not.toBeNull();

    await act(async () => {
      fireEvent.submit(form!);
      // Wait for handleClose promise to resolve
      await Promise.resolve();
    });

    expect(callback).toHaveBeenCalledWith('5678');
    expect(closeMock).not.toHaveBeenCalled();
    expect(screen.getByText('Form error')).toBeInTheDocument();
  });
});

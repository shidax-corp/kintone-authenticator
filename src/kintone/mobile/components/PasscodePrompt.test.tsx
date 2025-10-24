import '@testing-library/jest-dom';
import { act, render, waitFor } from '@testing-library/react';

import PasscodePrompt from './PasscodePrompt';

describe('PasscodePrompt', () => {
  let promptMock: jest.SpyInstance;
  let alertMock: jest.SpyInstance;

  beforeEach(() => {
    promptMock = jest.spyOn(window, 'prompt');
    alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    promptMock.mockRestore();
    alertMock.mockRestore();
  });

  it('calls prompt when shown is true', async () => {
    promptMock.mockReturnValueOnce('1234');
    const callback = jest.fn().mockResolvedValueOnce(undefined);

    render(<PasscodePrompt shown={true} callback={callback} />);

    await waitFor(() => {
      expect(promptMock).toHaveBeenCalledWith('パスコードを入力してください');
      expect(callback).toHaveBeenCalledWith('1234');
    });
  });

  it('does not call prompt when shown is false', async () => {
    const callback = jest.fn();

    render(<PasscodePrompt shown={false} callback={callback} />);

    // Wait a bit to ensure no calls are made
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(promptMock).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });

  it('calls callback with null when user cancels', async () => {
    promptMock.mockReturnValueOnce(null);
    const callback = jest.fn().mockResolvedValueOnce(undefined);

    render(<PasscodePrompt shown={true} callback={callback} />);

    await waitFor(() => {
      expect(promptMock).toHaveBeenCalledWith('パスコードを入力してください');
      expect(callback).toHaveBeenCalledWith(null);
    });
  });

  it('shows alert and retries when callback throws error', async () => {
    promptMock.mockReturnValueOnce('wrong').mockReturnValueOnce('correct');

    const callback = jest
      .fn()
      .mockRejectedValueOnce(new Error('パスコードが違います。'))
      .mockResolvedValueOnce(undefined);

    render(<PasscodePrompt shown={true} callback={callback} />);

    await waitFor(() => {
      expect(promptMock).toHaveBeenCalledTimes(2);
      expect(alertMock).toHaveBeenCalledWith('パスコードが違います。');
      expect(callback).toHaveBeenCalledWith('wrong');
      expect(callback).toHaveBeenCalledWith('correct');
    });
  });

  it('stops retrying when user cancels after error', async () => {
    promptMock.mockReturnValueOnce('wrong').mockReturnValueOnce(null);

    const callback = jest
      .fn()
      .mockRejectedValueOnce(new Error('パスコードが違います。'))
      .mockResolvedValueOnce(undefined);

    render(<PasscodePrompt shown={true} callback={callback} />);

    await waitFor(() => {
      expect(promptMock).toHaveBeenCalledTimes(2);
      expect(alertMock).toHaveBeenCalledWith('パスコードが違います。');
      expect(callback).toHaveBeenCalledWith('wrong');
      expect(callback).toHaveBeenCalledWith(null);
    });
  });

  it('shows alert with string message when callback throws non-Error object', async () => {
    promptMock.mockReturnValueOnce('1234').mockReturnValueOnce(null);
    const callback = jest
      .fn()
      .mockRejectedValueOnce('String error')
      .mockResolvedValueOnce(undefined);

    render(<PasscodePrompt shown={true} callback={callback} />);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('String error');
    });
  });

  it('does not call prompt twice for the same shown=true state', async () => {
    promptMock.mockReturnValueOnce('1234');
    const callback = jest.fn().mockResolvedValueOnce(undefined);

    const { rerender } = render(
      <PasscodePrompt shown={true} callback={callback} />
    );

    await waitFor(() => {
      expect(promptMock).toHaveBeenCalledTimes(1);
    });

    // 同じpropsで再レンダリング
    rerender(<PasscodePrompt shown={true} callback={callback} />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(promptMock).toHaveBeenCalledTimes(1);
  });

  it('calls prompt again when shown changes from false to true', async () => {
    promptMock.mockReturnValueOnce('1234').mockReturnValueOnce('5678');
    const callback = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const { rerender } = render(
      <PasscodePrompt shown={true} callback={callback} />
    );

    await waitFor(() => {
      expect(promptMock).toHaveBeenCalledTimes(1);
    });

    // shownをfalseに変更
    rerender(<PasscodePrompt shown={false} callback={callback} />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // shownをtrueに変更
    rerender(<PasscodePrompt shown={true} callback={callback} />);

    await waitFor(() => {
      expect(promptMock).toHaveBeenCalledTimes(2);
    });
  });
});

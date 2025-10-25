import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';

import QRScanner from './QRScanner';

describe('QRScanner', () => {
  let getUserMediaMock: jest.Mock;
  let mockStream: MediaStream;
  let mockVideoTrack: MediaStreamTrack;
  let mockCanvasContext: CanvasRenderingContext2D;

  beforeEach(() => {
    // MediaStreamのモックを作成
    mockVideoTrack = {
      stop: jest.fn(),
      kind: 'video',
    } as unknown as MediaStreamTrack;

    mockStream = {
      getTracks: jest.fn(() => [mockVideoTrack]),
    } as unknown as MediaStream;

    getUserMediaMock = jest.fn(() => Promise.resolve(mockStream));

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: getUserMediaMock,
      },
    });

    // Canvas 2D contextのモックを作成
    mockCanvasContext = {
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(),
        width: 640,
        height: 480,
      })),
    } as unknown as CanvasRenderingContext2D;

    // HTMLCanvasElement.prototype.getContextのモック
    HTMLCanvasElement.prototype.getContext = jest.fn(
      () => mockCanvasContext
    ) as any;

    // HTMLVideoElement.prototype.playのモック
    HTMLVideoElement.prototype.play = jest.fn(() => Promise.resolve());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('カメラを一度だけ起動する', async () => {
    const onRead = jest.fn();
    const onError = jest.fn();

    render(<QRScanner onRead={onRead} onError={onError} />);

    await waitFor(() => {
      expect(getUserMediaMock).toHaveBeenCalledTimes(1);
    });

    // エラーが呼ばれていないことを確認
    expect(onError).not.toHaveBeenCalled();
  });

  it('onReadコールバックが変更されてもカメラを再起動しない', async () => {
    const onRead1 = jest.fn();
    const onRead2 = jest.fn();
    const onError = jest.fn();

    const { rerender } = render(
      <QRScanner onRead={onRead1} onError={onError} />
    );

    await waitFor(() => {
      expect(getUserMediaMock).toHaveBeenCalledTimes(1);
    });

    // onReadコールバックを変更して再レンダリング
    rerender(<QRScanner onRead={onRead2} onError={onError} />);

    // カメラは依然として一度しか起動されていないことを確認
    expect(getUserMediaMock).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('onErrorコールバックが変更されてもカメラを再起動しない', async () => {
    const onRead = jest.fn();
    const onError1 = jest.fn();
    const onError2 = jest.fn();

    const { rerender } = render(
      <QRScanner onRead={onRead} onError={onError1} />
    );

    await waitFor(() => {
      expect(getUserMediaMock).toHaveBeenCalledTimes(1);
    });

    // onErrorコールバックを変更して再レンダリング
    rerender(<QRScanner onRead={onRead} onError={onError2} />);

    // カメラは依然として一度しか起動されていないことを確認
    expect(getUserMediaMock).toHaveBeenCalledTimes(1);
    expect(onError1).not.toHaveBeenCalled();
    expect(onError2).not.toHaveBeenCalled();
  });

  it('カメラの起動に失敗した場合にonErrorを呼ぶ', async () => {
    const onRead = jest.fn();
    const onError = jest.fn();
    const error = new DOMException('Permission denied', 'NotAllowedError');

    getUserMediaMock.mockRejectedValueOnce(error);

    render(<QRScanner onRead={onRead} onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });

    expect(onError).toHaveBeenCalledWith(
      new Error('カメラへのアクセスが許可されていません')
    );
  });

  it('カメラが見つからない場合に適切なエラーメッセージを表示', async () => {
    const onRead = jest.fn();
    const onError = jest.fn();
    const error = new DOMException('No camera found', 'NotFoundError');

    getUserMediaMock.mockRejectedValueOnce(error);

    render(<QRScanner onRead={onRead} onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });

    expect(onError).toHaveBeenCalledWith(new Error('カメラが見つかりません'));
  });

  it('アンマウント時にカメラストリームを停止する', async () => {
    const onRead = jest.fn();
    const onError = jest.fn();

    const { unmount } = render(<QRScanner onRead={onRead} onError={onError} />);

    await waitFor(() => {
      expect(getUserMediaMock).toHaveBeenCalledTimes(1);
    });

    unmount();

    // ストリームのトラックが停止されたことを確認
    expect(mockVideoTrack.stop).toHaveBeenCalled();
  });
});

# ライブラリカタログ

このドキュメントは、`src/lib/` ディレクトリに含まれるライブラリの一覧を示します。
libディレクトリは、kintoneアプリとChrome拡張の両方で使用される汎用的なユーティリティ関数とOTP関連機能を含んでいます。

## base32

**インポート**: `import { b32encode, b32decode } from '@lib/base32'`

**説明**: Base32エンコード/デコード機能を提供するライブラリ。OTPの秘密鍵の処理に使用される。

**関数**:

- `b32encode(data: ArrayLike<number>): string` - データをBase32文字列にエンコードする。パディング文字を含む。
- `b32decode(str: string): Uint8Array` - Base32文字列をバイトアレイにデコードする。パディング文字は自動的に除去される。

## gen-otp

**インポート**: `import { generateHOTP, generateTOTP, prettifyOTP } from '@lib/gen-otp'`

**説明**: HOTP（カウンタベース）とTOTP（時刻ベース）のワンタイムパスワード生成機能。RFC 4226とRFC 6238に準拠している。

**型定義**:

- `HOTPRequest` - HOTP生成リクエストの型（secret、algorithm、digits）
- `TOTPRequest` - TOTP生成リクエストの型（secret、algorithm、digits、period?）
- `HOTP` - HOTP生成結果の型（type、otp、timestamp）
- `TOTP` - TOTP生成結果の型（type、otp、timestamp、availableFrom、availableUntil）
- `OTP` - HOTP | TOTPの共用型

**関数**:

- `generateHOTP(request: HOTPRequest, counter: number): Promise<HOTP>` - カウンタベースのOTPを生成する。
- `generateTOTP(request: TOTPRequest, currentTime: number | null = null): Promise<TOTP>` - 時刻ベースのOTPを生成する。currentTimeがnullまたは未指定の場合は現在時刻を使用。
- `prettifyOTP(otp: string): string` - OTPを見やすい形式（スペース区切り）にフォーマットする。5〜12桁の長さに対応。

## hmac

**インポート**: `import { hmac } from '@lib/hmac'`

**説明**: HMAC署名計算機能を提供するライブラリ。Web Crypto APIを使用してセキュアな署名計算を行う。

**型定義**:

- `HashAlgorithm` - サポートされるハッシュアルゴリズム（'SHA-1' | 'SHA-256' | 'SHA-512'）

**関数**:

- `hmac(key: Uint8Array, data: Uint8Array | number, algorithm: HashAlgorithm): Promise<Uint8Array>` - HMAC署名を計算する。dataが数値の場合は8バイトのビッグエンディアン形式に変換される。

## otpauth-uri

**インポート**: `import { encodeOTPAuthURI, decodeOTPAuthURI, isValidOTPAuthURI } from '@lib/otpauth-uri'`

**説明**: OTPAuth URI（otpauth://プロトコル）のエンコード/デコード機能。Google Authenticatorなどで使用されるURI形式をサポートする。

**型定義**:

- `OTPAuthRecord` - OTP認証情報のレコード（HOTPまたはTOTP）
- `OTPAuthRecordHOTP` - HOTP専用のレコード型（counter含む）
- `OTPAuthRecordTOTP` - TOTP専用のレコード型（period含む）

**関数**:

- `encodeOTPAuthURI(record: OTPAuthRecord): string` - OTPレコードをOTPAuth URIにエンコードする。
- `decodeOTPAuthURI(uri: string): OTPAuthRecord` - OTPAuth URIをOTPレコードにデコードする。無効な形式の場合はエラーをスローする。
- `isValidOTPAuthURI(uri: string): Promise<boolean>` - OTPAuth URIの有効性を非同期で検証する。実際にOTP生成を試行して検証する。

## qr-reader

**インポート**: `import { readQRFromImage, readQRFromCanvas, readQRFromElement, QRReadError } from '@lib/qr-reader'`

**説明**: QRコード読み取り機能を提供するライブラリ。jsqrライブラリを使用して画像、キャンバス、HTML要素からQRコードを読み取る。

**クラス**:

- `QRReadError extends Error` - QRコード読み取り専用のエラークラス

**関数**:

- `readQRFromImage(imageUrl: string): Promise<string>` - 画像URLからQRコードを非同期で読み取る。
- `readQRFromCanvas(canvas: HTMLCanvasElement): string | null` - キャンバス要素からQRコードを同期で読み取る。見つからない場合はnullを返す。
- `readQRFromElement(element: HTMLElement): Promise<string>` - HTML要素からQRコードを読み取る。画像、キャンバス、SVG、背景画像をサポート。

**サポート要素**:

- HTMLImageElement - src属性の画像から読み取り
- HTMLCanvasElement - キャンバス内容から読み取り
- SVGElement - SVGをBlobに変換して読み取り
- その他の要素 - background-imageスタイルから読み取り

## search

**インポート**: `import { filterRecords, matchURL } from '@lib/search'`

**説明**: kintoneレコードの検索・フィルタリング機能を提供するライブラリ。名前による部分一致検索とURLのワイルドカード検索をサポートする。

**関数**:

- `filterRecords<T extends kintone.types.Fields>(records: T[], query: string): T[]` - 検索クエリに基づいてレコードをフィルタリングする。名前に対しては部分一致、URLに対してはワイルドカード（\*）対応の検索を行う。複数のキーワードをスペース区切りで指定可能。
- `matchURL(urlPattern: string, query: string): boolean` - URLパターンがクエリにマッチするかどうかを判定する。ワイルドカード（\*）を含むパターンマッチングや、http/httpsで始まるクエリの前方一致をサポート。

## url

**インポート**: `import { isValidURL, isValidURLPattern, extractOriginURL } from '@lib/url'`

**説明**: URL検証ユーティリティ。有効なURLかどうかをチェックする機能を提供する。

**関数**:

- `isValidURL(url: string): boolean` - 文字列が有効なURLかどうかをチェックする。URL()コンストラクタを使用して検証。
- `isValidURLPattern(url: string): boolean` - ワイルドカード（\*）を含むURLパターンの有効性をチェックする。httpsプロトコルが未指定の場合は自動で補完される。
- `extractOriginURL(url: string | undefined): string` - URLからオリジン（プロトコル + ドメイン + 末尾のスラッシュ）を抽出する。無効なURLの場合は元のURLを返す。

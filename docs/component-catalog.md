# コンポーネントカタログ

このドキュメントは、`src/components/` ディレクトリに含まれるUIコンポーネントの一覧を示します。
componentsディレクトリは、kintoneアプリとChrome拡張の両方で使用される汎用的なコンポーネントを含んでいます。

## CopyField

**インポート**: `import CopyField from '@components/CopyField'`

**説明**: クリックでテキストをクリップボードにコピーするフィールドコンポーネント。

**Props**:

- `value?: string` - コピーするテキスト。省略された場合はクリックしても反応しなくなる。
- `className?: string` - コンポーネントに適用する追加のCSSクラス。
- `copied?: boolean` - trueにするとコピー完了のメッセージが表示される。通常は自動で制御されるので指定しなくてもよい。
- `children: ReactNode` - フィールド内に表示するコンテンツ。

**関数**:

- `copyToClipboard(text: string): Promise<void>` - テキストをクリップボードにコピーする関数。

**定数**:

- `COPIED_MESSAGE_DURATION = 3000` - コピー完了メッセージの表示時間（ミリ秒）

## Field

**インポート**: `import Field from '@components/Field'`

**説明**: シンプルなフィールドとラベルを表示するコンポーネント。

**Props**:

- `label: ReactNode` - フィールドの上に表示するラベル。
- `onClick?: () => void` - フィールドコンテンツがクリックされたときのコールバック関数。
- `children: ReactNode` - フィールドの内容として表示するコンテンツ。

## GlobalStyle

**インポート**: `import GlobalStyle from '@components/GlobalStyle'`

**説明**: 全体で共有するスタイルを定義するコンポーネント。

**Props**:

- `tint?: boolean` - レコード詳細画面など、背景がやや暗い画面で使う場合に `true` を指定する。
- `children: ReactNode` - 表示するコンテンツ。

## InputField

**インポート**: `import InputField from '@components/InputField'`

**説明**: テキスト入力フィールドを表示するコンポーネント。

**Props**:

- `type: 'text' | 'url' | 'password' | 'search'` - 入力フィールドのタイプ。
- `label: string` - フィールドの上に表示するラベル。
- `placeholder?: string` - 入力フィールドのプレースホルダーテキスト。
- `value: string` - 入力フィールドの現在の値。
- `onChange: (value: string) => void` - 入力値が変更されたときに呼び出されるコールバック関数。
- `error?: string` - エラーメッセージを表示するための文字列。
- `required?: boolean` - 入力フィールドが必須かどうかを示すフラグ。デフォルトは false。

## OTPField

**インポート**: `import OTPField from '@components/OTPField'`

**説明**: ワンタイムパスワードを表示するコンポーネント。

**Props**:

- `uri: string` - OTP Auth URI。
- `onClick?: (otp: string) => void` - OTPがクリックされたときのコールバック関数。デフォルトではOTPをコピーする。
- `onUpdate?: (newURI: string) => void` - HOTPのカウンターが更新されたときに呼び出されるコールバック関数。引数には新しいURIが渡される。
- `className?: string` - コンポーネントに適用する追加のCSSクラス。
- `fontSize?: string` - OTPのフォントサイズ。デフォルトは '1.3rem'。

## OTPInputField

**インポート**: `import OTPInputField from '@components/OTPInputField'`

**説明**: OTP Auth URIを入力するためのフィールドコンポーネント。カメラからのQRコードスキャン、ファイルからの読み取り、画像のコピー&ペースト、手入力の4種類の方法をサポートする。

**Props**:

- `label: string` - フィールドの上に表示するラベル。
- `value: string` - 現在の値。
- `onChange: (value: string, info: OTPAuthRecord | null) => void` - 入力値が変更されたときに呼び出されるコールバック関数。第二引数にはデコードされたOTP認証情報が渡される。
- `disableCamera?: boolean` - カメラスキャン機能を無効にするかどうか。デフォルトは false。

## PasswordField

**インポート**: `import PasswordField from '@components/PasswordField'`

**説明**: パスワードを表示するフィールドコンポーネント。マウスオーバー・フォーカス時に内容が表示される。

**Props**:

- `value: string` - 表示するパスワードの値。
- `onClick?: () => void` - パスワードがクリックされたときのコールバック関数。デフォルトではパスワードをコピーする。
- `className?: string` - コンポーネントに適用する追加のCSSクラス。

## QRScanner

**インポート**: `import QRScanner from '@components/QRScanner'`

**説明**: QRコードをスキャンするためのコンポーネント。カメラを使用してQRコードを読み取り、成功した場合は`onRead`コールバックを呼び出す。

**Props**:

- `onRead: (data: string) => void` - QRコードが正常にスキャンされたときに呼び出されるコールバック関数。
- `onError: (error: Error) => void` - QRコードのスキャンに失敗したときに呼び出されるコールバック関数。

## SearchField

**インポート**: `import SearchField from '@components/SearchField'`

**説明**: 検索用の入力フィールドを表示するコンポーネント。

**Props**:

- `value: string` - 入力フィールドの現在の値。
- `placeholder?: string` - 入力フィールドのプレースホルダーテキスト。省略すると "名前またはURLで検索" になる。
- `onChange: (value: string) => void` - 入力値が変更されたときに呼び出されるコールバック関数。

## TextField

**インポート**: `import TextField from '@components/TextField'`

**説明**: シンプルなテキストフィールドを表示するコンポーネント。

**Props**:

- `label: string` - フィールドの上に表示するラベル。
- `value: string` - 表示するテキストの値。
- `onClick?: () => void` - テキストがクリックされたときのコールバック関数。デフォルトではテキストをコピーする。
- `className?: string` - コンポーネントに適用する追加のCSSクラス。

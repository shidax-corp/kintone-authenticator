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

## MaskedField

**インポート**: `import MaskedField from '@components/MaskedField'`

**説明**: 暗号化されたフィールドの代わりに表示するコンポーネント。鍵アイコンとマスクされたテキストを表示し、クリックすると復号化のためのコールバックが呼ばれる。

**Props**:

- `label: ReactNode` - フィールドの上に表示するラベル。
- `onClick?: () => void` - フィールドがクリックされたときに呼び出されるコールバック関数。

## PasscodeInputField

**インポート**: `import PasscodeInputField from '@components/PasscodeInputField'`

**説明**: レコードを暗号化するかどうかのチェックボックスと、暗号化パスコードの入力フィールドを表示するコンポーネント。パスコードを入力すると暗号化が有効になり、クリアすると無効になる。

**Props**:

- `value: string | null` - 現在の暗号化パスコード。無効化されている場合は `null` になる。
- `onChange: (value: string | null) => void` - パスコードが変更されたときに呼び出されるコールバック関数。文字列の場合は有効、`null` の場合は無効を示す。

## Keychain

**インポート**: `import Keychain, { useKeychain, type PasscodeHandler, type PromptComponent, type PromptComponentProps } from '@components/Keychain'`

**説明**: 暗号化のためのパスコードを一括管理するためのコンポーネント。パスコードは難読化した上でセッションストレージに保存される。子コンポーネントは `useKeychain` フックを使用してパスコードにアクセスできる。

**Props**:

- `prompt: PromptComponent` - パスコードの入力を促すコンポーネント。
- `children: ReactNode` - 子コンポーネント。

**型定義**:

- `PasscodeHandler = (passcode: string) => Promise<boolean>` - パスコードが追加・読み取りされたときのハンドラーの型。`true` を返すと正しいパスコードとして処理される。
- `PromptComponentProps = { shown: boolean; callback: (passcode: string | null) => Promise<void> }` - パスコード入力コンポーネントのプロパティ。
- `PromptComponent = FC<PromptComponentProps>` - パスコード入力コンポーネントの型。

**フック**:

- `useKeychain(onPasscode: PasscodeHandler)` - Keychainからパスコードを取得したり、新たなパスコードを追加したりするためのフック。戻り値は以下のプロパティを含むオブジェクト:
  - `savePasscode: (passcode: string) => Promise<void>` - 新たなパスコードをKeychainに保存する関数。
  - `passcodes: string[]` - 現在Keychainに保存されているパスコードの配列。
  - `MaskedField: FC<{ label: string }>` - 暗号化されたフィールドの代わりに表示するダミーコンポーネント。クリックするとパスコード入力ダイアログが表示される。

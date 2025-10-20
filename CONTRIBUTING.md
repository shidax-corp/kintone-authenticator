# Contributing

本ドキュメントは、このリポジトリに貢献してくださる方に向けたガイドラインです。
利用者向けの説明は[README.md](./README.md)をご覧ください。

## バグを見つけたとき / 機能を提案したいとき

バグを見つけたときや新しい機能を提案したいときは、[Issue](https://github.com/shidax-corp/kintone-authenticator/issues)を立ててください。
Issueはなるべく詳細に分かりやすく書いてください。日本語でも英語でも構いません。

なお、すべてのIssueに対応できるわけではありません。ご容赦ください。

## 開発に参加したいとき

### 開発環境の準備

以下のコマンドでセットアップできます。

```bash
git clone https://github.com/shidax-corp/kintone-authenticator.git
cd kintone-authenticator

npm install
```

セットアップが完了したら、以下のコマンドでビルドできます。

```bash
npm run build
```

ビルド結果は`dist/`ディレクトリに出力されます。
`dist/chrome/`がChrome拡張機能、`dist/kintone/`がkintoneカスタマイズのコードです。

ビルド結果をCLIからkintoneにデプロイするには、`.env.example`をコピーして`.env`を作成し、必要な環境変数を設定してください。
その後、以下のコマンドでデプロイできます。

```bash
npm run deploy:kintone
```

### 開発ルール

- 本リポジトリにコントリビュートしたいときは、Pull Requestの前にまずIssueを立ててください。不完全なIssueでも大歓迎です。

- コミットメッセージの一行目とPull Requestのタイトルは[Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/)の形式に従ってください。

  例:
  - `feat(kintone): QRコードを読み取る機能を実装`
  - `fix(chrome): 自動入力の問題を修正 #123`

- Issue, コミットメッセージ, Pull Requestなどはなるべく詳細に分かりやすく書いてください。日本語でも英語でも構いません。

- コミット前に以下のコマンドを実行してコードを整形し、型チェック、Lintチェック、テストを通過させてください。

```bash
npm run format
npm run check
npm run test
```

### 開発ドキュメント

このリポジトリでは、以下の開発ドキュメントを提供しています。

- 要件資料
  - [kintoneカスタマイズの要件](./docs/kintone-requirements.md)
  - [Chrome拡張機能の要件](./docs/chrome-extension-requirements.md)

- 開発資料
  - [ライブラリ（共通コード）の一覧](./docs/lib-catalog.md)
  - [共通コンポーネントの一覧](./docs/component-catalog.md)

ドキュメントはAIを利用して作成・更新しているため、内容に誤りがある可能性があります。

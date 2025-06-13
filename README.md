# kintone authenticator

もしもGoogle Authenticatorのようなアプリがkintone上で動いたら？


## システム構成

![システム構成図。kintoneアプリが1つあり、カスタマイズでQRコード読み取りや暗号化/復号、OTP生成などを行なう。また、Google Chromeの拡張機能でも同等の機能や自動入力機能を提供する。](./docs/system_diagram.drawio.svg)


## 要件

- 機密情報はpinコードで暗号化する。
- 拡張機能を使った自動入力に対応させる。

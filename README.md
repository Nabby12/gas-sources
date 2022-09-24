# gas-sources

google apps scripts向けソースコード
主に clasp で管理

## clasp 導入

```shell
# install
npm install @google/clasp -g

# gas関数の補完パッケージ
npm install @types/google-apps-script

# アカウント認証（表示されたURLから権限許可操作を実施）
clasp login --no-localhost
```

## 開発

```shell
# 関数作成（対話形式で作成したいアプリケーションにあわせて操作）
clasp create

## ソースコード作成・編集

# gas側のソースコード更新
clasp push

# gas側のエディター表示
clasp open

# ※gasのwebエディターでコードを修正した場合は下記コマンドでローカルに反映
clasp pull
```

# たくさんの日記帳
めいめいさんの misskey フォークです。  
https://github.com/mei23/misskey

## オリジナル要素

// TODO

## 本番環境構築

## Setup?
簡単なセットアップ方法はこの辺  
https://github.com/mei23/memo/blob/master/misskey/Setup-Meisskey-Quick.md

Cloudflare を利用しない場合は DNS サーバーに A レコード追加、Let's Encrypt の nginx モードで SSL 証明書生成が必要です。

## Vulnerabilities?
脆弱性を見つけたらこちら  
If you find any vulnerabilities, please report them here.  
https://github.com/mei23/misskey/security/advisories/new

## 手元の開発環境構築
多分フロントエンドのみ開発・・みたいなことは出来ないので、本番環境と同じような構成をしないとダメです  
`Windows`しか知らない

- `node.js`、`git`を入れる
    - わたしは（別件で）入ってたので省略
- `redis`と`mongoDB`を入れる。どっちもインストーラーから入れられます、ありがとうございます
    - https://www.mongodb.com/try/download/community
        - `C:\Program Files\MongoDB\Server\6.0\data`にデータベースがある？
    - https://github.com/tporadowski/redis
        - 有志の`Windows`用バイナリ
            - 何の見返りも求めずバイナリを用意してくれたキミにありがとう
- `pnpm` を入れる
    - `npm install -g pnpm`
- このリポジトリを`git clone`する
- ライブラリを入れる
    - `pnpm i`
        - `Windows`の場合は`PowerShell`だとなんか怒られる。`Git Bash`などを使うとうまくいく
- `.config/example.yml`をコピーして、`.config/default.yml`を作り、編集する
    - なぜか`localhost`が解決できないので、`127.0.0.1`にする（私だけかも）

```yaml
# Final accessible URL seen by a user.
# 開発用 : localhost にする
url: http://localhost:3000

# Listen port
port: 3000

# Listen address (default is probably any)
# addr: '127.0.0.0'

# 開発用 : host を直す
mongodb:
  host: 127.0.0.1
  port: 27017
  db: misskey
  #user: example-misskey-user
  #pass: example-misskey-pass
  #options:
  #  poolSize: 10

# Redis
# 開発用 : host を直す
redis:
  host: 127.0.0.1
  port: 6379
  #family: 0 # 0=Both, 4=IPv4, 6=IPv6
  #pass: example-pass
  #prefix: example-prefix
  #db: 0

# これ以降は同じ
```

- `pnpm build`をする
- `pnpm start`をする
    - アスキーアートが出るはず

```
takusan23@DESKTOP-ULEKIDB MINGW64 ~/Desktop/Dev/NodeJS/misskey (diary-takusan_23)
$ pnpm start

> misskey@10.102.661-m544 start C:\Users\takusan23\Desktop\Dev\NodeJS\misskey
> node ./index.js

DONE *  [core boot config]      Loaded
INFO *  [core boot env] NODE_ENV is not set
WARN *  [core boot env] The environment is not in production mode.
WARN *  [core boot env] DO NOT USE FOR PRODUCTION PURPOSE!
INFO *  [core boot nodejs]      Version 18.13.0
VERB *  [core boot machine]     Hostname: DESKTOP-ULEKIDB
VERB *  [core boot machine]     Platform: win32 Arch: x64
(node:14932) DeprecationWarning: Listening to events on the Db class has been deprecated and will be removed in the next major version.
(Use `node --trace-deprecation ...` to show where the warning was created)
VERB *  [core boot machine]     CPU: 6 core MEM: 15.7GB (available: 5.3GB)
INFO *  [core boot db]  Connecting to mongodb://127.0.0.1:27017/misskey ...
DONE *  [core boot db]  Connectivity confirmed
INFO *  [core boot db]  Version: 6.0.8

 ______        _           _
|  ___ \      (_)         | |
| | _ | | ____ _  ___  ___| |  _ ____ _   _
| || || |/ _  ) |/___)/___) | / ) _  ) | | |
| || || ( (/ /| |___ |___ | |< ( (/ /| |_| |
|_||_||_|\____)_(___/(___/|_| \_)____)\__  |
                                     (____/
 v10.102.661-m544-io4i10j8

< DESKTOP-ULEKIDB (PID: 14932) >
INFO *  [core boot]     Welcome to Meisskey!
INFO *  [core boot]     Meisskey v10.102.661-m544-io4i10j8
DONE *  [core boot]     Meisskey initialized
DONE *  [core boot]     Now listening on port 3000 on http://localhost:3000
```

- `http://localhost:3000`にアクセスする
    - 開けるはず！おめでとう！

![Imgur](https://imgur.com/82TBoNP.png)

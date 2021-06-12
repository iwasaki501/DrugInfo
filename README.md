# DrugInfo

## 使用法
- 薬剤名を A 列に入力すると、[日経メディカル処方薬事典](https://medical.nikkeibp.co.jp/inc/all/drugdic/) から分類・一般名・副作用を抽出して自動で入力
- 薬剤候補が複数ある場合は、プルダウンリストが表示されるのでその中から選択する

![animation](https://github.com/iwasaki501/DrugInfo/blob/7ff60833ca6c2122ed5612544198809aea3aab89/Animation.gif?raw=true)

## 導入方法
1. PC ブラウザで新規 Google Spreadsheet を作成
2. 「ツール」→「スクリプトエディタ」→「コード.gs」の中身を消去し、 [これ](https://raw.githubusercontent.com/iwasaki501/DrugInfo/main/main.gs) の中身を貼り付け
3. `Ctrl` + `S` で保存
4. 画面左の時計アイコン (トリガー) → 画面右下の「トリガーを作成」をクリック
5. 下記画像の通りに設定し、保存

<img src="https://github.com/iwasaki501/DrugInfo/blob/f8e44427fc4a524461389231147e6a4be2bb45b6/Setting.png?raw=true" width="50%">

6. 表示される新規ウィンドウに従い Google アカウントにログイン
7. 「このアプリは Google で確認されていません」が表示されたら、左下の「詳細」リンク → 「無題のプロジェクト（安全ではないページ）に移動」→「許可」
8. A 列 に何か入力して動作確認

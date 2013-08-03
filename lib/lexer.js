// This script licensed under the MIT.
// http://orgachem.mit-license.org

"use strict";

(function() {
  /**
   * 語句解析器クラス。ソースコードを読みこみ、トークン列に分解する {@link #lex}
   * メソッドをもつ。 トークン列は {@link #lex} メソッドの戻り値、または
   * {@link #tokens} で参照できる。
   * @constructor
   */
  var Lexer = function() {};


  /**
   * 行末文字かどうかを判定する。
   * @param {string} ch チェックする文字。
   * @return {boolean} {@code ch} が行末文字ならば true。
   */
  var isLineTerminator = function isLineTerminator(ch) {
      return (ch === '\n' || ch === '\r' || ch === '\u2028' || ch === '\u2029');
  }

  /**
   * 文字を指定した回数繰り返した文字列を返す。
   * @param {string} str 繰り返す文字列。
   * @param {number} num 繰り返す回数。
   * @return {string} 繰り返された文字列。
   */
  var repeat = function repeat(str, num) {
    return Array(num + 1).join(str);
  };


  /**
   * トークンの識別子の列挙型。
   * @enum {string}
   */
  Lexer.TokenType = {
    /** 開括弧トークンの識別子。「す」を指す。 */
    OPEN_BRACKET: 'openbracket',

    /** 閉括弧トークンの識別子。「のうち。」を指す。 */
    CLOSE_BRACKET: 'closebracket',

    /** 数字リテラルの識別子。「も」と「の」からなる文字列を指す。 */
    NUMBER_LITERAL: 'numberliteral',

    /** 演算子トークンの識別子。「も」と「の」からなる文字列を指す。 */
    OPERATOR: 'operator',

    /** ファイル末尾トークンの識別子。 */
    EOF: 'eof'
  };


  /**
   * 字句解析器クラスを初期化する。
   * @param {string} str 解析する文字列。
   */
  Lexer.prototype.initialize = function initialize(str) {
    if (typeof str !== 'string') {
      this.throwError('INVALIED_INPUT');
    }
    this.source = str;
    this.sourceLength_ = str.length;

    this.index_ = 0;
    this.lineStart_ = 0;
    this.lineNumber_ = 0;

    this.tokens = [];
  };


  /**
   * 字句解析器クラスの後始末をおこなう。
   */
  Lexer.prototype.finalize = function finalize() {
    delete this.sourceLength_;

    delete this.index_;
    delete this.lineStart_;
    delete this.lineNumber_;
  };


  /**
   * メッセージに字句解析器の状態を加えた例外を発生させる。
   *
   * 表示例：
   * <pre>
   * Unexpected char: "ぬ"
   * すぬもも。
   * 　^
   * </pre>
   */
  Lexer.prototype.throwError = function throwError(errName, opt_msg) {
    // 1. 改行毎に分解
    // 2. エラー箇所を表示するカーソルを生成
    // 3. エラー行の下にカーソルを加える
    // 4. 追加メッセージがあれば先頭に追加
    // 4. メッセージを先頭に追加
    var lines = this.source.split(/\n|\r|\u2028|\u2029/);
    var cursor = repeat('　', this.index_ - this.lineStart_ - 1) + '^';
    lines.splice(this.lineNumber_ + 1, 0, cursor);

    if (opt_msg) {
      lines.unshift(opt_msg);
    }
    lines.unshift(errName);

    var err = Error(lines.join('\n'));
    err.name = errName;

    throw err;
  };


  /**
   * 現在の文字が、予期される文字と一致していない場合に例外を発生させる。
   * @param {string} expected 予期される文字。
   */
  Lexer.prototype.expect = function expect(expected) {
    var ch = this.source[this.index_];
    if (ch !== expected) {
      this.throwError('UNEXPECTED_CHAR', 'Expected "' + expected + '"' +
                      ' but come "' + ch + '".');
    }
  };


  /**
   * 字句解析をおこなう。
   * @param {string} lex 字句解析する文字列。
   * @return {Array.<{type: string}>} トークン配列。
   */
  Lexer.prototype.lex = function lex(str) {
    this.initialize(str);

    while (this.index_ < this.sourceLength_) {
      this.skip();
      this.scanExpression();
    }

    this.finalize();

    return this.tokens;
  };


  /**
   * すもも式を解析する。
   */
  Lexer.prototype.scanExpression = function scanExpression() {
    var ch, token;

    this.skip();

    if (this.index_ >= this.sourceLength_) {
      this.tokens.push({
        type: Lexer.TokenType.EOF,
        lineNumber: this.lineNumber_,
        lineStart: this.lineStart_,
        range: [this.index_, this.index_]
      });
      return;
    }

    ch = this.source[this.index_];

    switch (ch) {
      case 'す':
        this.scanOpenBracket();
        this.scanOperator();
        this.scanParameters();
        this.scanCloseBracket();
        break;
      case 'も':
      case 'の':
        if (this.source[this.index_ + 1] === 'う') {
          this.throwError('UNEXPECTED_CHAR');
        }
        this.scanNumberLiteral();
        break;
      default:
        this.throwError('UNEXPECTED_CHAR: ' + ch);
    }

    this.skip();
  };


  /**
   * すもも式のパラメータ節を解析する。
   */
  Lexer.prototype.scanParameters = function scanParameters() {
    while (this.source[this.index_] === '、') {
      ++this.index_;
      this.scanExpression();
    }
  };


  /**
   * 数値リテラルを返す。
   * @return {{type: string}} 数値リテラルトークン。
   * @private
   */
  Lexer.prototype.scanNumberLiteral_ = function scanNumberLiteral_() {
    var ch = this.source[this.index_],
        start = this.index_,
        end;

    while (ch === 'も' || ch === 'の') {
      if (this.index_ >= this.sourceLength_) {
        this.throwError('UNEXPECTED_EOF');
      }
      ch = this.source[++this.index_];
    }

    // もし、次の文字が「う」ならば直前の「の」は閉括弧のもの。
    if (ch === 'う') {
      --this.index_;
    }

    return {
      type: Lexer.TokenType.NUMBER_LITERAL,
      value: this.source.slice(start, this.index_ - 1),
      lineNumber: this.lineNumber_,
      lineStart: this.lineStart_,
      range: [start, this.index_ - 1]
    };
  };


  /**
   * 数値リテラルを解析する。
   * @private
   */
  Lexer.prototype.scanNumberLiteral = function scanNumberLiteral() {
    var token = this.scanNumberLiteral_();
    this.tokens.push(token);
  };


  /**
   * 演算子を解析する。
   */
  Lexer.prototype.scanOperator = function scanOperator() {
    var token = this.scanNumberLiteral_();
    token.type = Lexer.TokenType.OPERATOR;
    this.tokens.push(token);
  };


  /**
   * 開括弧を解析する。
   */
  Lexer.prototype.scanOpenBracket = function scanOpenBracket() {
    this.expect('す');

    this.tokens.push({
      type: Lexer.TokenType.OPEN_BRACKET,
      lineNumber: this.lineNumber_,
      lineStart: this.lineStart_,
      range: [this.index_, this.index_]
    });

    ++this.index_;
  };


  /**
   * 閉括弧を解析する。
   */
  Lexer.prototype.scanCloseBracket = function scanCloseBracket() {
    this.expect('の');
    ++this.index_;
    this.expect('う');
    ++this.index_;
    this.expect('ち');
    ++this.index_;
    this.expect('。');

    this.tokens.push({
      type: Lexer.TokenType.CLOSE_BRACKET,
      lineNumber: this.lineNumber_,
      lineStart: this.lineStart_,
      range: [this.index_ - 3, this.index_]
    });

    ++this.index_;
  };


  /**
   * 「す」、「も」、「の」、「う」、「ち」、「、」「。」以外の文字をスキップ
   * する。コードに改行文字が含まれる可能性がある場合、この関数を使用しないと、
   * 行数処理に失敗する。
   */
  Lexer.prototype.skip = function() {
    var ch;

    while (this.index_ < this.sourceLength_) {
      ch = this.source[this.index_];

      if (isLineTerminator(ch)) {
        this.lineStart_ = this.index_++;
        ++this.lineNumber_;
      }
      else if (ch === 'も' || ch === 'の' || ch === '、' ||  ch === 'す' || ch === 'う' || ch === 'ち' || ch === '。') {
        break;
      }
      else {
        ++this.index_;
      }
    }
  };

  module.exports = Lexer;
})();

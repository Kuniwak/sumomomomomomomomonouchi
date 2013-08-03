// This script licensed under the MIT.
// http://orgachem.mit-license.org

"use strict";

(function() {
  /**
   * 語句解析器クラス。ソースコードを読みこみ、トークン列に分解する{@link "lex}
   * メソッドをもつ。
   * @constructor
   */
  var Lexer = function() {};

  var isLineTerminator = function isLineTerminator(ch) {
      return (ch === '\n' || ch === '\r' || ch === '\u2028' || ch === '\u2029');
  }

  var repeat = function repeat(char, num) {
    return Array(num + 1).join(char);
  };


  /**
   * トークンの識別子の列挙型。
   * @enum {number}
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


  Lexer.prototype.initialize = function initialize(str) {
    if (!str) {
      this.throwError('INVALIED_INPUT');
    }
    this.source = str;
    this.sourceLength_ = str.length;

    this.index_ = 0;
    this.lineStart_ = 0;
    this.lineNumber_ = 0;

    this.tokens = [];
  };


  Lexer.prototype.finalize = function finalize() {
    delete this.sourceLength_;

    delete this.index_;
    delete this.lineStart_;
    delete this.lineNumber_;
  };


  Lexer.prototype.throwError = function throwError(msg) {
    var lines = this.source.split(/\n|\r|\u2028|\u2029/);
    var cursor = repeat('　', this.index_ - this.lineStart_ - 1) + '^';
    lines.splice(this.lineNumber_ + 1, 0, cursor);
    lines.unshift(msg);

    console.log(this.tokens);
    throw Error(lines.join('\n'));
  };


  Lexer.prototype.expect = function expect(came, expected) {
    if (expected !== came) {
      this.throwError('Expected "' + expected + '" but come "' + came + '"');
    }
  };


  Lexer.prototype.lex = function lex(str) {
    this.initialize(str);

    console.log();
    while (this.index_ < this.sourceLength_) {
      this.skip();
      this.scanExpression();
    }

    this.finalize();

    return this.tokens;
  };


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
        console.log(this.source[this.index_], this.index_);
        this.scanCloseBracket();
        break;
      case 'も':
      case 'の':
        this.scanNumberLiteral();
        break;
      default:
        this.throwError('UNEXPECTED_CHAR: ' + ch);
    }

    this.skip();
  };


  Lexer.prototype.scanParameters = function scanParameters() {
    while (this.source[this.index_] === '、') {
      ++this.index_;
      this.scanExpression();
    }
  };


  /**
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


  Lexer.prototype.scanNumberLiteral = function scanNumberLiteral() {
    var token = this.scanNumberLiteral_();
    this.tokens.push(token);
  };


  Lexer.prototype.scanOperator = function scanOperator() {
    var token = this.scanNumberLiteral_();
    token.type = Lexer.TokenType.OPERATOR;
    this.tokens.push(token);
  };


  Lexer.prototype.scanOpenBracket = function scanOpenBracket() {
    var ch = this.source[this.index_];

    this.expect(ch, 'す');

    this.tokens.push({
      type: Lexer.TokenType.OPEN_BRACKET,
      lineNumber: this.lineNumber_,
      lineStart: this.lineStart_,
      range: [this.index_, this.index_]
    });

    ++this.index_;
  };


  Lexer.prototype.scanCloseBracket = function scanCloseBracket() {
    this.expect(this.source[this.index_], 'の');
    this.expect(this.source[++this.index_], 'う');
    this.expect(this.source[++this.index_], 'ち');
    this.expect(this.source[++this.index_], '。');

    this.tokens.push({
      type: Lexer.TokenType.CLOSE_BRACKET,
      lineNumber: this.lineNumber_,
      lineStart: this.lineStart_,
      range: [this.index_ - 3, this.index_]
    });

    ++this.index_;
  };


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

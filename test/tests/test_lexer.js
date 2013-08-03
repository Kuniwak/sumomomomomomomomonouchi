// This script licensed under the MIT.
// http://orgachem.mit-license.org

var expect = require('../../node_modules/expect.js');

var Lexer = require('../../lib/lexer.js');

describe('Lexer', function() {
  it('should analyze an one-line code', function() {
    var lexer = new Lexer();
    lexer.lex('すももも、ものののものののうち。');
    expect(lexer.tokens).to.have.length(4);
  });

  it('should analyze a multi-lines code', function() {
    var lexer = new Lexer();
    lexer.lex([
      'すももも、',
        'すもももも、',
          'もののもののの、',
          'ものののものも、',
          'もののもものの、',
          'もののもものの、',
          'もののもももも、',
          'もののののの、',
          'ものものももも、',
          'もののもももも、',
          'ものもののもの、',
          'もののもものの、',
          'ものののものの',
        'のうち。',
      'のうち。'
    ].join('\n'));

    expect(lexer.tokens).to.have.length(17);
  });

  it('should analyze a multi-exprs code', function() {
    var lexer = new Lexer();
    lexer.lex('すも、ものうち。すもも、ものものうち。');

    expect(lexer.tokens).to.have.length(8);
  });

  it('should evaluate an expr as a value', function() {
    var lexer = new Lexer();
    lexer.lex('すももも、すもももも、もののもののの、ものののものも、もののもものの、もののもものの、もののもももも、もののののの、ものものももも、もののもももも、ものもののもの、もののもものの、ものののものののうち。のうち。');

    expect(lexer.tokens).to.have.length(17);
  });

  it('should analyze multi-params expr', function() {
    var lexer = new Lexer();
    lexer.lex('すもももも、もののもののの、ものののものものうち。');

    expect(lexer.tokens).to.have.length(5);
  });

  it('should analyze null string code', function() {
    var lexer = new Lexer();
    lexer.lex('');

    expect(lexer.tokens).to.have.length(0);
  });

  it('should be failed by given undefined', function() {
    var lexer = new Lexer();
    expect(function() {
      lexer.lex();
    }).to.throwError();
  });

  it('should be failed by given unexpected close bracket', function() {
    var lexer = new Lexer();
    expect(function() {
      lexer.lex('すも、ものうち。のうち。');
    }).to.throwError();
  });
});

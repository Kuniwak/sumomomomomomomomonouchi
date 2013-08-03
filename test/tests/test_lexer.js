// This script licensed under the MIT.
// http://orgachem.mit-license.org

var expect = require('../../node_modules/expect.js');

var Lexer = require('../../lib/lexer.js');

describe('Lexer', function() {
  it('should analyze "hello, world"', function() {
    var lexer = new Lexer();
    lexer.lex('すももも、すもももも、もののもののの、ものののものも、もののもものの、もののもものの、もののもももも、もののののの、ものものももも、もののもももも、ものもののもの、もののもものの、ものののものののうち。のうち。');
    console.log(lexer);
  });
});

// @ts-ignore
import * as antlr4 from 'antlr4';
// @ts-ignore
import { QueryParamsLexer } from './QueryParamsLexer';
// @ts-ignore
import { QueryParamsParser } from './QueryParamsParser';

// let MyGrammarParser = require('./QueryParamsLexer').MyGrammarParser;
// let MyGrammarListener = require('./QueryParamsLexer').MyGrammarListener;

export function parseQueryParams(input:string) {
    let chars = new antlr4.InputStream(input);
    let lexer = new QueryParamsLexer(chars);
    let tokens  = new antlr4.CommonTokenStream(lexer);
    // console.log(tokens);
    let parser = new QueryParamsParser(tokens);
    parser.buildParseTrees = true;
    let tree = parser.querystring();
    console.log(tree.toStringTree(parser.ruleNames)); 
}

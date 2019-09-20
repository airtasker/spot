// Generated from lib/src/neu/verifications/parsers/QueryParams.g4 by ANTLR 4.7.1
import org.antlr.v4.runtime.tree.ParseTreeListener;

/**
 * This interface defines a complete listener for a parse tree produced by
 * {@link QueryParamsParser}.
 */
public interface QueryParamsListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by {@link QueryParamsParser#value}.
	 * @param ctx the parse tree
	 */
	void enterValue(QueryParamsParser.ValueContext ctx);
	/**
	 * Exit a parse tree produced by {@link QueryParamsParser#value}.
	 * @param ctx the parse tree
	 */
	void exitValue(QueryParamsParser.ValueContext ctx);
	/**
	 * Enter a parse tree produced by {@link QueryParamsParser#param}.
	 * @param ctx the parse tree
	 */
	void enterParam(QueryParamsParser.ParamContext ctx);
	/**
	 * Exit a parse tree produced by {@link QueryParamsParser#param}.
	 * @param ctx the parse tree
	 */
	void exitParam(QueryParamsParser.ParamContext ctx);
	/**
	 * Enter a parse tree produced by {@link QueryParamsParser#array}.
	 * @param ctx the parse tree
	 */
	void enterArray(QueryParamsParser.ArrayContext ctx);
	/**
	 * Exit a parse tree produced by {@link QueryParamsParser#array}.
	 * @param ctx the parse tree
	 */
	void exitArray(QueryParamsParser.ArrayContext ctx);
	/**
	 * Enter a parse tree produced by {@link QueryParamsParser#piped}.
	 * @param ctx the parse tree
	 */
	void enterPiped(QueryParamsParser.PipedContext ctx);
	/**
	 * Exit a parse tree produced by {@link QueryParamsParser#piped}.
	 * @param ctx the parse tree
	 */
	void exitPiped(QueryParamsParser.PipedContext ctx);
	/**
	 * Enter a parse tree produced by {@link QueryParamsParser#querystring}.
	 * @param ctx the parse tree
	 */
	void enterQuerystring(QueryParamsParser.QuerystringContext ctx);
	/**
	 * Exit a parse tree produced by {@link QueryParamsParser#querystring}.
	 * @param ctx the parse tree
	 */
	void exitQuerystring(QueryParamsParser.QuerystringContext ctx);
}
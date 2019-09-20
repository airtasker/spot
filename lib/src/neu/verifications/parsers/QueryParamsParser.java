// Generated from lib/src/neu/verifications/parsers/QueryParams.g4 by ANTLR 4.7.1
import org.antlr.v4.runtime.atn.*;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.misc.*;
import org.antlr.v4.runtime.tree.*;
import java.util.List;
import java.util.Iterator;
import java.util.ArrayList;

@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast"})
public class QueryParamsParser extends Parser {
	static { RuntimeMetaData.checkVersion("4.7.1", RuntimeMetaData.VERSION); }

	protected static final DFA[] _decisionToDFA;
	protected static final PredictionContextCache _sharedContextCache =
		new PredictionContextCache();
	public static final int
		T__0=1, T__1=2, T__2=3, AMP=4, EQ=5, PIPE=6, WS=7, STRING=8;
	public static final int
		RULE_value = 0, RULE_param = 1, RULE_array = 2, RULE_piped = 3, RULE_querystring = 4;
	public static final String[] ruleNames = {
		"value", "param", "array", "piped", "querystring"
	};

	private static final String[] _LITERAL_NAMES = {
		null, "'['", "']'", "'?'", "'&'", "'='", "'|'"
	};
	private static final String[] _SYMBOLIC_NAMES = {
		null, null, null, null, "AMP", "EQ", "PIPE", "WS", "STRING"
	};
	public static final Vocabulary VOCABULARY = new VocabularyImpl(_LITERAL_NAMES, _SYMBOLIC_NAMES);

	/**
	 * @deprecated Use {@link #VOCABULARY} instead.
	 */
	@Deprecated
	public static final String[] tokenNames;
	static {
		tokenNames = new String[_SYMBOLIC_NAMES.length];
		for (int i = 0; i < tokenNames.length; i++) {
			tokenNames[i] = VOCABULARY.getLiteralName(i);
			if (tokenNames[i] == null) {
				tokenNames[i] = VOCABULARY.getSymbolicName(i);
			}

			if (tokenNames[i] == null) {
				tokenNames[i] = "<INVALID>";
			}
		}
	}

	@Override
	@Deprecated
	public String[] getTokenNames() {
		return tokenNames;
	}

	@Override

	public Vocabulary getVocabulary() {
		return VOCABULARY;
	}

	@Override
	public String getGrammarFileName() { return "QueryParams.g4"; }

	@Override
	public String[] getRuleNames() { return ruleNames; }

	@Override
	public String getSerializedATN() { return _serializedATN; }

	@Override
	public ATN getATN() { return _ATN; }

	public QueryParamsParser(TokenStream input) {
		super(input);
		_interp = new ParserATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);
	}
	public static class ValueContext extends ParserRuleContext {
		public TerminalNode STRING() { return getToken(QueryParamsParser.STRING, 0); }
		public ValueContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_value; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof QueryParamsListener ) ((QueryParamsListener)listener).enterValue(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof QueryParamsListener ) ((QueryParamsListener)listener).exitValue(this);
		}
	}

	public final ValueContext value() throws RecognitionException {
		ValueContext _localctx = new ValueContext(_ctx, getState());
		enterRule(_localctx, 0, RULE_value);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(10);
			match(STRING);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class ParamContext extends ParserRuleContext {
		public TerminalNode STRING() { return getToken(QueryParamsParser.STRING, 0); }
		public ParamContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_param; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof QueryParamsListener ) ((QueryParamsListener)listener).enterParam(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof QueryParamsListener ) ((QueryParamsListener)listener).exitParam(this);
		}
	}

	public final ParamContext param() throws RecognitionException {
		ParamContext _localctx = new ParamContext(_ctx, getState());
		enterRule(_localctx, 2, RULE_param);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(12);
			match(STRING);
			setState(13);
			match(EQ);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class ArrayContext extends ParserRuleContext {
		public List<TerminalNode> STRING() { return getTokens(QueryParamsParser.STRING); }
		public TerminalNode STRING(int i) {
			return getToken(QueryParamsParser.STRING, i);
		}
		public TerminalNode EQ() { return getToken(QueryParamsParser.EQ, 0); }
		public PipedContext piped() {
			return getRuleContext(PipedContext.class,0);
		}
		public ArrayContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_array; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof QueryParamsListener ) ((QueryParamsListener)listener).enterArray(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof QueryParamsListener ) ((QueryParamsListener)listener).exitArray(this);
		}
	}

	public final ArrayContext array() throws RecognitionException {
		ArrayContext _localctx = new ArrayContext(_ctx, getState());
		enterRule(_localctx, 4, RULE_array);
		try {
			setState(21);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case T__0:
				enterOuterAlt(_localctx, 1);
				{
				setState(15);
				match(T__0);
				setState(16);
				match(STRING);
				setState(17);
				match(T__1);
				setState(18);
				match(EQ);
				setState(19);
				match(STRING);
				}
				break;
			case STRING:
				enterOuterAlt(_localctx, 2);
				{
				setState(20);
				piped(0);
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class PipedContext extends ParserRuleContext {
		public TerminalNode STRING() { return getToken(QueryParamsParser.STRING, 0); }
		public List<PipedContext> piped() {
			return getRuleContexts(PipedContext.class);
		}
		public PipedContext piped(int i) {
			return getRuleContext(PipedContext.class,i);
		}
		public TerminalNode PIPE() { return getToken(QueryParamsParser.PIPE, 0); }
		public PipedContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_piped; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof QueryParamsListener ) ((QueryParamsListener)listener).enterPiped(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof QueryParamsListener ) ((QueryParamsListener)listener).exitPiped(this);
		}
	}

	public final PipedContext piped() throws RecognitionException {
		return piped(0);
	}

	private PipedContext piped(int _p) throws RecognitionException {
		ParserRuleContext _parentctx = _ctx;
		int _parentState = getState();
		PipedContext _localctx = new PipedContext(_ctx, _parentState);
		PipedContext _prevctx = _localctx;
		int _startState = 6;
		enterRecursionRule(_localctx, 6, RULE_piped, _p);
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			{
			setState(24);
			match(STRING);
			}
			_ctx.stop = _input.LT(-1);
			setState(31);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,1,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					if ( _parseListeners!=null ) triggerExitRuleEvent();
					_prevctx = _localctx;
					{
					{
					_localctx = new PipedContext(_parentctx, _parentState);
					pushNewRecursionContext(_localctx, _startState, RULE_piped);
					setState(26);
					if (!(precpred(_ctx, 2))) throw new FailedPredicateException(this, "precpred(_ctx, 2)");
					setState(27);
					match(PIPE);
					setState(28);
					piped(3);
					}
					} 
				}
				setState(33);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,1,_ctx);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			unrollRecursionContexts(_parentctx);
		}
		return _localctx;
	}

	public static class QuerystringContext extends ParserRuleContext {
		public ParamContext param() {
			return getRuleContext(ParamContext.class,0);
		}
		public QuerystringContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_querystring; }
		@Override
		public void enterRule(ParseTreeListener listener) {
			if ( listener instanceof QueryParamsListener ) ((QueryParamsListener)listener).enterQuerystring(this);
		}
		@Override
		public void exitRule(ParseTreeListener listener) {
			if ( listener instanceof QueryParamsListener ) ((QueryParamsListener)listener).exitQuerystring(this);
		}
	}

	public final QuerystringContext querystring() throws RecognitionException {
		QuerystringContext _localctx = new QuerystringContext(_ctx, getState());
		enterRule(_localctx, 8, RULE_querystring);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(34);
			match(T__2);
			setState(35);
			param();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public boolean sempred(RuleContext _localctx, int ruleIndex, int predIndex) {
		switch (ruleIndex) {
		case 3:
			return piped_sempred((PipedContext)_localctx, predIndex);
		}
		return true;
	}
	private boolean piped_sempred(PipedContext _localctx, int predIndex) {
		switch (predIndex) {
		case 0:
			return precpred(_ctx, 2);
		}
		return true;
	}

	public static final String _serializedATN =
		"\3\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964\3\n(\4\2\t\2\4\3\t"+
		"\3\4\4\t\4\4\5\t\5\4\6\t\6\3\2\3\2\3\3\3\3\3\3\3\4\3\4\3\4\3\4\3\4\3\4"+
		"\5\4\30\n\4\3\5\3\5\3\5\3\5\3\5\3\5\7\5 \n\5\f\5\16\5#\13\5\3\6\3\6\3"+
		"\6\3\6\2\3\b\7\2\4\6\b\n\2\2\2$\2\f\3\2\2\2\4\16\3\2\2\2\6\27\3\2\2\2"+
		"\b\31\3\2\2\2\n$\3\2\2\2\f\r\7\n\2\2\r\3\3\2\2\2\16\17\7\n\2\2\17\20\7"+
		"\7\2\2\20\5\3\2\2\2\21\22\7\3\2\2\22\23\7\n\2\2\23\24\7\4\2\2\24\25\7"+
		"\7\2\2\25\30\7\n\2\2\26\30\5\b\5\2\27\21\3\2\2\2\27\26\3\2\2\2\30\7\3"+
		"\2\2\2\31\32\b\5\1\2\32\33\7\n\2\2\33!\3\2\2\2\34\35\f\4\2\2\35\36\7\b"+
		"\2\2\36 \5\b\5\5\37\34\3\2\2\2 #\3\2\2\2!\37\3\2\2\2!\"\3\2\2\2\"\t\3"+
		"\2\2\2#!\3\2\2\2$%\7\5\2\2%&\5\4\3\2&\13\3\2\2\2\4\27!";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}
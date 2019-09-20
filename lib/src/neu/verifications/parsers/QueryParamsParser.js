// Generated from lib/src/neu/verifications/parsers/QueryParams.g4 by ANTLR 4.7.1
// jshint ignore: start
var antlr4 = require('antlr4/index');
var QueryParamsListener = require('./QueryParamsListener').QueryParamsListener;
var grammarFileName = "QueryParams.g4";

var serializedATN = ["\u0003\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964",
    "\u0003\u000bT\u0004\u0002\t\u0002\u0004\u0003\t\u0003\u0004\u0004\t",
    "\u0004\u0004\u0005\t\u0005\u0004\u0006\t\u0006\u0004\u0007\t\u0007\u0004",
    "\b\t\b\u0003\u0002\u0003\u0002\u0003\u0002\u0005\u0002\u0014\n\u0002",
    "\u0003\u0003\u0003\u0003\u0003\u0003\u0003\u0003\u0003\u0003\u0003\u0003",
    "\u0003\u0003\u0003\u0003\u0005\u0003\u001e\n\u0003\u0003\u0004\u0003",
    "\u0004\u0003\u0004\u0003\u0004\u0003\u0004\u0003\u0004\u0003\u0004\u0006",
    "\u0004\'\n\u0004\r\u0004\u000e\u0004(\u0007\u0004+\n\u0004\f\u0004\u000e",
    "\u0004.\u000b\u0004\u0003\u0005\u0003\u0005\u0003\u0005\u0003\u0005",
    "\u0003\u0005\u0003\u0005\u0007\u00056\n\u0005\f\u0005\u000e\u00059\u000b",
    "\u0005\u0003\u0006\u0003\u0006\u0003\u0006\u0003\u0006\u0003\u0006\u0003",
    "\u0006\u0007\u0006A\n\u0006\f\u0006\u000e\u0006D\u000b\u0006\u0003\u0007",
    "\u0003\u0007\u0003\u0007\u0003\u0007\u0003\u0007\u0003\u0007\u0007\u0007",
    "L\n\u0007\f\u0007\u000e\u0007O\u000b\u0007\u0003\b\u0003\b\u0003\b\u0003",
    "\b\u0002\u0006\u0006\b\n\f\t\u0002\u0004\u0006\b\n\f\u000e\u0002\u0002",
    "\u0002T\u0002\u0013\u0003\u0002\u0002\u0002\u0004\u001d\u0003\u0002",
    "\u0002\u0002\u0006\u001f\u0003\u0002\u0002\u0002\b/\u0003\u0002\u0002",
    "\u0002\n:\u0003\u0002\u0002\u0002\fE\u0003\u0002\u0002\u0002\u000eP",
    "\u0003\u0002\u0002\u0002\u0010\u0014\u0007\u000b\u0002\u0002\u0011\u0014",
    "\u0005\b\u0005\u0002\u0012\u0014\u0005\n\u0006\u0002\u0013\u0010\u0003",
    "\u0002\u0002\u0002\u0013\u0011\u0003\u0002\u0002\u0002\u0013\u0012\u0003",
    "\u0002\u0002\u0002\u0014\u0003\u0003\u0002\u0002\u0002\u0015\u0016\u0007",
    "\u000b\u0002\u0002\u0016\u0017\u0007\t\u0002\u0002\u0017\u001e\u0005",
    "\u0002\u0002\u0002\u0018\u0019\u0007\u000b\u0002\u0002\u0019\u001a\u0005",
    "\u0006\u0004\u0002\u001a\u001b\u0007\t\u0002\u0002\u001b\u001c\u0005",
    "\u0002\u0002\u0002\u001c\u001e\u0003\u0002\u0002\u0002\u001d\u0015\u0003",
    "\u0002\u0002\u0002\u001d\u0018\u0003\u0002\u0002\u0002\u001e\u0005\u0003",
    "\u0002\u0002\u0002\u001f \b\u0004\u0001\u0002 !\u0007\u0003\u0002\u0002",
    "!\"\u0007\u000b\u0002\u0002\"#\u0007\u0004\u0002\u0002#,\u0003\u0002",
    "\u0002\u0002$&\f\u0004\u0002\u0002%\'\u0005\u0006\u0004\u0002&%\u0003",
    "\u0002\u0002\u0002\'(\u0003\u0002\u0002\u0002(&\u0003\u0002\u0002\u0002",
    "()\u0003\u0002\u0002\u0002)+\u0003\u0002\u0002\u0002*$\u0003\u0002\u0002",
    "\u0002+.\u0003\u0002\u0002\u0002,*\u0003\u0002\u0002\u0002,-\u0003\u0002",
    "\u0002\u0002-\u0007\u0003\u0002\u0002\u0002.,\u0003\u0002\u0002\u0002",
    "/0\b\u0005\u0001\u000201\u0007\u000b\u0002\u000217\u0003\u0002\u0002",
    "\u000223\f\u0004\u0002\u000234\u0007\u0005\u0002\u000246\u0005\b\u0005",
    "\u000552\u0003\u0002\u0002\u000269\u0003\u0002\u0002\u000275\u0003\u0002",
    "\u0002\u000278\u0003\u0002\u0002\u00028\t\u0003\u0002\u0002\u000297",
    "\u0003\u0002\u0002\u0002:;\b\u0006\u0001\u0002;<\u0007\u000b\u0002\u0002",
    "<B\u0003\u0002\u0002\u0002=>\f\u0004\u0002\u0002>?\u0007\u0006\u0002",
    "\u0002?A\u0005\n\u0006\u0005@=\u0003\u0002\u0002\u0002AD\u0003\u0002",
    "\u0002\u0002B@\u0003\u0002\u0002\u0002BC\u0003\u0002\u0002\u0002C\u000b",
    "\u0003\u0002\u0002\u0002DB\u0003\u0002\u0002\u0002EF\b\u0007\u0001\u0002",
    "FG\u0005\u0004\u0003\u0002GM\u0003\u0002\u0002\u0002HI\f\u0004\u0002",
    "\u0002IJ\u0007\b\u0002\u0002JL\u0005\f\u0007\u0005KH\u0003\u0002\u0002",
    "\u0002LO\u0003\u0002\u0002\u0002MK\u0003\u0002\u0002\u0002MN\u0003\u0002",
    "\u0002\u0002N\r\u0003\u0002\u0002\u0002OM\u0003\u0002\u0002\u0002PQ",
    "\u0007\u0007\u0002\u0002QR\u0005\u0004\u0003\u0002R\u000f\u0003\u0002",
    "\u0002\u0002\t\u0013\u001d(,7BM"].join("");


var atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

var decisionsToDFA = atn.decisionToState.map( function(ds, index) { return new antlr4.dfa.DFA(ds, index); });

var sharedContextCache = new antlr4.PredictionContextCache();

var literalNames = [ null, "'['", "']'", "'|'", "','", "'?'", "'&'", "'='" ];

var symbolicNames = [ null, null, null, null, null, null, "AMP", "EQ", "WS", 
                      "STRING" ];

var ruleNames =  [ "value", "param", "arrayIndex", "piped", "commaed", "params", 
                   "querystring" ];

function QueryParamsParser (input) {
	antlr4.Parser.call(this, input);
    this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
    this.ruleNames = ruleNames;
    this.literalNames = literalNames;
    this.symbolicNames = symbolicNames;
    return this;
}

QueryParamsParser.prototype = Object.create(antlr4.Parser.prototype);
QueryParamsParser.prototype.constructor = QueryParamsParser;

Object.defineProperty(QueryParamsParser.prototype, "atn", {
	get : function() {
		return atn;
	}
});

QueryParamsParser.EOF = antlr4.Token.EOF;
QueryParamsParser.T__0 = 1;
QueryParamsParser.T__1 = 2;
QueryParamsParser.T__2 = 3;
QueryParamsParser.T__3 = 4;
QueryParamsParser.T__4 = 5;
QueryParamsParser.AMP = 6;
QueryParamsParser.EQ = 7;
QueryParamsParser.WS = 8;
QueryParamsParser.STRING = 9;

QueryParamsParser.RULE_value = 0;
QueryParamsParser.RULE_param = 1;
QueryParamsParser.RULE_arrayIndex = 2;
QueryParamsParser.RULE_piped = 3;
QueryParamsParser.RULE_commaed = 4;
QueryParamsParser.RULE_params = 5;
QueryParamsParser.RULE_querystring = 6;

function ValueContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = QueryParamsParser.RULE_value;
    return this;
}

ValueContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
ValueContext.prototype.constructor = ValueContext;

ValueContext.prototype.STRING = function() {
    return this.getToken(QueryParamsParser.STRING, 0);
};

ValueContext.prototype.piped = function() {
    return this.getTypedRuleContext(PipedContext,0);
};

ValueContext.prototype.commaed = function() {
    return this.getTypedRuleContext(CommaedContext,0);
};

ValueContext.prototype.enterRule = function(listener) {
    if(listener instanceof QueryParamsListener ) {
        listener.enterValue(this);
	}
};

ValueContext.prototype.exitRule = function(listener) {
    if(listener instanceof QueryParamsListener ) {
        listener.exitValue(this);
	}
};




QueryParamsParser.ValueContext = ValueContext;

QueryParamsParser.prototype.value = function() {

    var localctx = new ValueContext(this, this._ctx, this.state);
    this.enterRule(localctx, 0, QueryParamsParser.RULE_value);
    try {
        this.state = 17;
        this._errHandler.sync(this);
        var la_ = this._interp.adaptivePredict(this._input,0,this._ctx);
        switch(la_) {
        case 1:
            this.enterOuterAlt(localctx, 1);
            this.state = 14;
            this.match(QueryParamsParser.STRING);
            break;

        case 2:
            this.enterOuterAlt(localctx, 2);
            this.state = 15;
            this.piped(0);
            break;

        case 3:
            this.enterOuterAlt(localctx, 3);
            this.state = 16;
            this.commaed(0);
            break;

        }
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};

function ParamContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = QueryParamsParser.RULE_param;
    return this;
}

ParamContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
ParamContext.prototype.constructor = ParamContext;

ParamContext.prototype.STRING = function() {
    return this.getToken(QueryParamsParser.STRING, 0);
};

ParamContext.prototype.value = function() {
    return this.getTypedRuleContext(ValueContext,0);
};

ParamContext.prototype.arrayIndex = function() {
    return this.getTypedRuleContext(ArrayIndexContext,0);
};

ParamContext.prototype.enterRule = function(listener) {
    if(listener instanceof QueryParamsListener ) {
        listener.enterParam(this);
	}
};

ParamContext.prototype.exitRule = function(listener) {
    if(listener instanceof QueryParamsListener ) {
        listener.exitParam(this);
	}
};




QueryParamsParser.ParamContext = ParamContext;

QueryParamsParser.prototype.param = function() {

    var localctx = new ParamContext(this, this._ctx, this.state);
    this.enterRule(localctx, 2, QueryParamsParser.RULE_param);
    try {
        this.state = 27;
        this._errHandler.sync(this);
        var la_ = this._interp.adaptivePredict(this._input,1,this._ctx);
        switch(la_) {
        case 1:
            this.enterOuterAlt(localctx, 1);
            this.state = 19;
            this.match(QueryParamsParser.STRING);
            this.state = 20;
            this.match(QueryParamsParser.EQ);
            this.state = 21;
            this.value();
            break;

        case 2:
            this.enterOuterAlt(localctx, 2);
            this.state = 22;
            this.match(QueryParamsParser.STRING);
            this.state = 23;
            this.arrayIndex(0);
            this.state = 24;
            this.match(QueryParamsParser.EQ);
            this.state = 25;
            this.value();
            break;

        }
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};

function ArrayIndexContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = QueryParamsParser.RULE_arrayIndex;
    return this;
}

ArrayIndexContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
ArrayIndexContext.prototype.constructor = ArrayIndexContext;

ArrayIndexContext.prototype.STRING = function() {
    return this.getToken(QueryParamsParser.STRING, 0);
};

ArrayIndexContext.prototype.arrayIndex = function(i) {
    if(i===undefined) {
        i = null;
    }
    if(i===null) {
        return this.getTypedRuleContexts(ArrayIndexContext);
    } else {
        return this.getTypedRuleContext(ArrayIndexContext,i);
    }
};

ArrayIndexContext.prototype.enterRule = function(listener) {
    if(listener instanceof QueryParamsListener ) {
        listener.enterArrayIndex(this);
	}
};

ArrayIndexContext.prototype.exitRule = function(listener) {
    if(listener instanceof QueryParamsListener ) {
        listener.exitArrayIndex(this);
	}
};



QueryParamsParser.prototype.arrayIndex = function(_p) {
	if(_p===undefined) {
	    _p = 0;
	}
    var _parentctx = this._ctx;
    var _parentState = this.state;
    var localctx = new ArrayIndexContext(this, this._ctx, _parentState);
    var _prevctx = localctx;
    var _startState = 4;
    this.enterRecursionRule(localctx, 4, QueryParamsParser.RULE_arrayIndex, _p);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 30;
        this.match(QueryParamsParser.T__0);
        this.state = 31;
        this.match(QueryParamsParser.STRING);
        this.state = 32;
        this.match(QueryParamsParser.T__1);
        this._ctx.stop = this._input.LT(-1);
        this.state = 42;
        this._errHandler.sync(this);
        var _alt = this._interp.adaptivePredict(this._input,3,this._ctx)
        while(_alt!=2 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
            if(_alt===1) {
                if(this._parseListeners!==null) {
                    this.triggerExitRuleEvent();
                }
                _prevctx = localctx;
                localctx = new ArrayIndexContext(this, _parentctx, _parentState);
                this.pushNewRecursionContext(localctx, _startState, QueryParamsParser.RULE_arrayIndex);
                this.state = 34;
                if (!( this.precpred(this._ctx, 2))) {
                    throw new antlr4.error.FailedPredicateException(this, "this.precpred(this._ctx, 2)");
                }
                this.state = 36; 
                this._errHandler.sync(this);
                var _alt = 1;
                do {
                	switch (_alt) {
                	case 1:
                		this.state = 35;
                		this.arrayIndex(0);
                		break;
                	default:
                		throw new antlr4.error.NoViableAltException(this);
                	}
                	this.state = 38; 
                	this._errHandler.sync(this);
                	_alt = this._interp.adaptivePredict(this._input,2, this._ctx);
                } while ( _alt!=2 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER ); 
            }
            this.state = 44;
            this._errHandler.sync(this);
            _alt = this._interp.adaptivePredict(this._input,3,this._ctx);
        }

    } catch( error) {
        if(error instanceof antlr4.error.RecognitionException) {
	        localctx.exception = error;
	        this._errHandler.reportError(this, error);
	        this._errHandler.recover(this, error);
	    } else {
	    	throw error;
	    }
    } finally {
        this.unrollRecursionContexts(_parentctx)
    }
    return localctx;
};

function PipedContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = QueryParamsParser.RULE_piped;
    return this;
}

PipedContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
PipedContext.prototype.constructor = PipedContext;

PipedContext.prototype.STRING = function() {
    return this.getToken(QueryParamsParser.STRING, 0);
};

PipedContext.prototype.piped = function(i) {
    if(i===undefined) {
        i = null;
    }
    if(i===null) {
        return this.getTypedRuleContexts(PipedContext);
    } else {
        return this.getTypedRuleContext(PipedContext,i);
    }
};

PipedContext.prototype.enterRule = function(listener) {
    if(listener instanceof QueryParamsListener ) {
        listener.enterPiped(this);
	}
};

PipedContext.prototype.exitRule = function(listener) {
    if(listener instanceof QueryParamsListener ) {
        listener.exitPiped(this);
	}
};



QueryParamsParser.prototype.piped = function(_p) {
	if(_p===undefined) {
	    _p = 0;
	}
    var _parentctx = this._ctx;
    var _parentState = this.state;
    var localctx = new PipedContext(this, this._ctx, _parentState);
    var _prevctx = localctx;
    var _startState = 6;
    this.enterRecursionRule(localctx, 6, QueryParamsParser.RULE_piped, _p);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 46;
        this.match(QueryParamsParser.STRING);
        this._ctx.stop = this._input.LT(-1);
        this.state = 53;
        this._errHandler.sync(this);
        var _alt = this._interp.adaptivePredict(this._input,4,this._ctx)
        while(_alt!=2 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
            if(_alt===1) {
                if(this._parseListeners!==null) {
                    this.triggerExitRuleEvent();
                }
                _prevctx = localctx;
                localctx = new PipedContext(this, _parentctx, _parentState);
                this.pushNewRecursionContext(localctx, _startState, QueryParamsParser.RULE_piped);
                this.state = 48;
                if (!( this.precpred(this._ctx, 2))) {
                    throw new antlr4.error.FailedPredicateException(this, "this.precpred(this._ctx, 2)");
                }
                this.state = 49;
                this.match(QueryParamsParser.T__2);
                this.state = 50;
                this.piped(3); 
            }
            this.state = 55;
            this._errHandler.sync(this);
            _alt = this._interp.adaptivePredict(this._input,4,this._ctx);
        }

    } catch( error) {
        if(error instanceof antlr4.error.RecognitionException) {
	        localctx.exception = error;
	        this._errHandler.reportError(this, error);
	        this._errHandler.recover(this, error);
	    } else {
	    	throw error;
	    }
    } finally {
        this.unrollRecursionContexts(_parentctx)
    }
    return localctx;
};

function CommaedContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = QueryParamsParser.RULE_commaed;
    return this;
}

CommaedContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
CommaedContext.prototype.constructor = CommaedContext;

CommaedContext.prototype.STRING = function() {
    return this.getToken(QueryParamsParser.STRING, 0);
};

CommaedContext.prototype.commaed = function(i) {
    if(i===undefined) {
        i = null;
    }
    if(i===null) {
        return this.getTypedRuleContexts(CommaedContext);
    } else {
        return this.getTypedRuleContext(CommaedContext,i);
    }
};

CommaedContext.prototype.enterRule = function(listener) {
    if(listener instanceof QueryParamsListener ) {
        listener.enterCommaed(this);
	}
};

CommaedContext.prototype.exitRule = function(listener) {
    if(listener instanceof QueryParamsListener ) {
        listener.exitCommaed(this);
	}
};



QueryParamsParser.prototype.commaed = function(_p) {
	if(_p===undefined) {
	    _p = 0;
	}
    var _parentctx = this._ctx;
    var _parentState = this.state;
    var localctx = new CommaedContext(this, this._ctx, _parentState);
    var _prevctx = localctx;
    var _startState = 8;
    this.enterRecursionRule(localctx, 8, QueryParamsParser.RULE_commaed, _p);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 57;
        this.match(QueryParamsParser.STRING);
        this._ctx.stop = this._input.LT(-1);
        this.state = 64;
        this._errHandler.sync(this);
        var _alt = this._interp.adaptivePredict(this._input,5,this._ctx)
        while(_alt!=2 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
            if(_alt===1) {
                if(this._parseListeners!==null) {
                    this.triggerExitRuleEvent();
                }
                _prevctx = localctx;
                localctx = new CommaedContext(this, _parentctx, _parentState);
                this.pushNewRecursionContext(localctx, _startState, QueryParamsParser.RULE_commaed);
                this.state = 59;
                if (!( this.precpred(this._ctx, 2))) {
                    throw new antlr4.error.FailedPredicateException(this, "this.precpred(this._ctx, 2)");
                }
                this.state = 60;
                this.match(QueryParamsParser.T__3);
                this.state = 61;
                this.commaed(3); 
            }
            this.state = 66;
            this._errHandler.sync(this);
            _alt = this._interp.adaptivePredict(this._input,5,this._ctx);
        }

    } catch( error) {
        if(error instanceof antlr4.error.RecognitionException) {
	        localctx.exception = error;
	        this._errHandler.reportError(this, error);
	        this._errHandler.recover(this, error);
	    } else {
	    	throw error;
	    }
    } finally {
        this.unrollRecursionContexts(_parentctx)
    }
    return localctx;
};

function ParamsContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = QueryParamsParser.RULE_params;
    return this;
}

ParamsContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
ParamsContext.prototype.constructor = ParamsContext;

ParamsContext.prototype.param = function() {
    return this.getTypedRuleContext(ParamContext,0);
};

ParamsContext.prototype.params = function(i) {
    if(i===undefined) {
        i = null;
    }
    if(i===null) {
        return this.getTypedRuleContexts(ParamsContext);
    } else {
        return this.getTypedRuleContext(ParamsContext,i);
    }
};

ParamsContext.prototype.enterRule = function(listener) {
    if(listener instanceof QueryParamsListener ) {
        listener.enterParams(this);
	}
};

ParamsContext.prototype.exitRule = function(listener) {
    if(listener instanceof QueryParamsListener ) {
        listener.exitParams(this);
	}
};



QueryParamsParser.prototype.params = function(_p) {
	if(_p===undefined) {
	    _p = 0;
	}
    var _parentctx = this._ctx;
    var _parentState = this.state;
    var localctx = new ParamsContext(this, this._ctx, _parentState);
    var _prevctx = localctx;
    var _startState = 10;
    this.enterRecursionRule(localctx, 10, QueryParamsParser.RULE_params, _p);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 68;
        this.param();
        this._ctx.stop = this._input.LT(-1);
        this.state = 75;
        this._errHandler.sync(this);
        var _alt = this._interp.adaptivePredict(this._input,6,this._ctx)
        while(_alt!=2 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
            if(_alt===1) {
                if(this._parseListeners!==null) {
                    this.triggerExitRuleEvent();
                }
                _prevctx = localctx;
                localctx = new ParamsContext(this, _parentctx, _parentState);
                this.pushNewRecursionContext(localctx, _startState, QueryParamsParser.RULE_params);
                this.state = 70;
                if (!( this.precpred(this._ctx, 2))) {
                    throw new antlr4.error.FailedPredicateException(this, "this.precpred(this._ctx, 2)");
                }
                this.state = 71;
                this.match(QueryParamsParser.AMP);
                this.state = 72;
                this.params(3); 
            }
            this.state = 77;
            this._errHandler.sync(this);
            _alt = this._interp.adaptivePredict(this._input,6,this._ctx);
        }

    } catch( error) {
        if(error instanceof antlr4.error.RecognitionException) {
	        localctx.exception = error;
	        this._errHandler.reportError(this, error);
	        this._errHandler.recover(this, error);
	    } else {
	    	throw error;
	    }
    } finally {
        this.unrollRecursionContexts(_parentctx)
    }
    return localctx;
};

function QuerystringContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = QueryParamsParser.RULE_querystring;
    return this;
}

QuerystringContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
QuerystringContext.prototype.constructor = QuerystringContext;

QuerystringContext.prototype.param = function() {
    return this.getTypedRuleContext(ParamContext,0);
};

QuerystringContext.prototype.enterRule = function(listener) {
    if(listener instanceof QueryParamsListener ) {
        listener.enterQuerystring(this);
	}
};

QuerystringContext.prototype.exitRule = function(listener) {
    if(listener instanceof QueryParamsListener ) {
        listener.exitQuerystring(this);
	}
};




QueryParamsParser.QuerystringContext = QuerystringContext;

QueryParamsParser.prototype.querystring = function() {

    var localctx = new QuerystringContext(this, this._ctx, this.state);
    this.enterRule(localctx, 12, QueryParamsParser.RULE_querystring);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 78;
        this.match(QueryParamsParser.T__4);
        this.state = 79;
        this.param();
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};


QueryParamsParser.prototype.sempred = function(localctx, ruleIndex, predIndex) {
	switch(ruleIndex) {
	case 2:
			return this.arrayIndex_sempred(localctx, predIndex);
	case 3:
			return this.piped_sempred(localctx, predIndex);
	case 4:
			return this.commaed_sempred(localctx, predIndex);
	case 5:
			return this.params_sempred(localctx, predIndex);
    default:
        throw "No predicate with index:" + ruleIndex;
   }
};

QueryParamsParser.prototype.arrayIndex_sempred = function(localctx, predIndex) {
	switch(predIndex) {
		case 0:
			return this.precpred(this._ctx, 2);
		default:
			throw "No predicate with index:" + predIndex;
	}
};

QueryParamsParser.prototype.piped_sempred = function(localctx, predIndex) {
	switch(predIndex) {
		case 1:
			return this.precpred(this._ctx, 2);
		default:
			throw "No predicate with index:" + predIndex;
	}
};

QueryParamsParser.prototype.commaed_sempred = function(localctx, predIndex) {
	switch(predIndex) {
		case 2:
			return this.precpred(this._ctx, 2);
		default:
			throw "No predicate with index:" + predIndex;
	}
};

QueryParamsParser.prototype.params_sempred = function(localctx, predIndex) {
	switch(predIndex) {
		case 3:
			return this.precpred(this._ctx, 2);
		default:
			throw "No predicate with index:" + predIndex;
	}
};


exports.QueryParamsParser = QueryParamsParser;

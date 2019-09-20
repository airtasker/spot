grammar QueryParams;

AMP : '&';
EQ : '=';
WS : [ \r\t\n]+ -> skip ;
STRING : [a-z]+;

value : STRING | piped | commaed;

param : STRING '=' value
        | STRING arrayIndex '=' value;

arrayIndex : arrayIndex arrayIndex+ | '[' STRING ']';

piped: piped '|' piped | STRING;
commaed: commaed ',' commaed | STRING;

params : params '&' params | param;

querystring : '?' param;

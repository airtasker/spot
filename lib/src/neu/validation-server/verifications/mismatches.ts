/**
 * Mismatches are used by the contract mismatcher to report on mismatches
 * between data and different components of a contract. They are not intended
 * to produce human friendly messages as they may not contain a sufficient
 * amount of contextual information.
 */

export enum MismatchKind {
  REQUIRED_HEADER_MISSING = "required_header_missing",
  UNDEFINED_HEADER = "undefined_header",
  HEADER_TYPE_DISPARITY = "header_type_disparity",
  PATH_PARAM_TYPE_DISPARITY = "path_param_type_disparity",
  REQUIRED_QUERY_PARAM_MISSING = "required_query_param_missing",
  UNDEFINED_QUERY_PARAM = "undefined_query_param",
  QUERY_PARAM_TYPE_DISPARITY = "query_param_type_disparity",
  UNDEFINED_BODY = "undefined_body",
  BODY_TYPE_DISPARITY = "body_type_disparity"
}

export interface RequiredHeaderMissingMismatch {
  kind: MismatchKind.REQUIRED_HEADER_MISSING;
  header: string;
}

export interface UndefinedHeaderMismatch {
  kind: MismatchKind.UNDEFINED_HEADER;
  header: string;
}

export interface HeaderTypeDisparityMismatch {
  kind: MismatchKind.HEADER_TYPE_DISPARITY;
  header: string;
  typeDisparities: string[];
}

export interface PathParamTypeDisparityMismatch {
  kind: MismatchKind.PATH_PARAM_TYPE_DISPARITY;
  pathParam: string;
  typeDisparities: string[];
}

export interface RequiredQueryParamMissingMismatch {
  kind: MismatchKind.REQUIRED_QUERY_PARAM_MISSING;
  queryParam: string;
}

export interface UndefinedQueryParamMismatch {
  kind: MismatchKind.UNDEFINED_QUERY_PARAM;
  queryParam: string;
}

export interface QueryParamTypeDisparityMismatch {
  kind: MismatchKind.QUERY_PARAM_TYPE_DISPARITY;
  queryParam: string;
  typeDisparities: string[];
}

export interface UndefinedBodyMismatch {
  kind: MismatchKind.UNDEFINED_BODY;
}

export interface BodyTypeDisparityMismatch {
  kind: MismatchKind.BODY_TYPE_DISPARITY;
  data: string;
  typeDisparities: string[];
}

export function requiredHeaderMissingMismatch(
  header: string
): RequiredHeaderMissingMismatch {
  return { kind: MismatchKind.REQUIRED_HEADER_MISSING, header };
}

export function undefinedHeaderMismatch(
  header: string
): UndefinedHeaderMismatch {
  return { kind: MismatchKind.UNDEFINED_HEADER, header };
}

export function headerTypeDisparityMismatch(
  header: string,
  typeDisparities: string[]
): HeaderTypeDisparityMismatch {
  return {
    kind: MismatchKind.HEADER_TYPE_DISPARITY,
    header,
    typeDisparities
  };
}

export function pathParamTypeDisparityMismatch(
  pathParam: string,
  typeDisparities: string[]
): PathParamTypeDisparityMismatch {
  return {
    kind: MismatchKind.PATH_PARAM_TYPE_DISPARITY,
    pathParam,
    typeDisparities
  };
}

export function requiredQueryParamMissingMismatch(
  queryParam: string
): RequiredQueryParamMissingMismatch {
  return { kind: MismatchKind.REQUIRED_QUERY_PARAM_MISSING, queryParam };
}

export function undefinedQueryParamMismatch(
  queryParam: string
): UndefinedQueryParamMismatch {
  return { kind: MismatchKind.UNDEFINED_QUERY_PARAM, queryParam };
}

export function queryParamTypeDisparityMismatch(
  queryParam: string,
  typeDisparities: string[]
): QueryParamTypeDisparityMismatch {
  return {
    kind: MismatchKind.QUERY_PARAM_TYPE_DISPARITY,
    queryParam,
    typeDisparities
  };
}

export function undefinedBodyMismatch(): UndefinedBodyMismatch {
  return { kind: MismatchKind.UNDEFINED_BODY };
}

export function bodyTypeDisparityMismatch(
  data: string,
  typeDisparities: string[]
): BodyTypeDisparityMismatch {
  return {
    kind: MismatchKind.BODY_TYPE_DISPARITY,
    data,
    typeDisparities
  };
}

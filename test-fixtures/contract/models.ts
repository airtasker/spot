/** A widget */
export interface Widget {
  /** widget identifier */
  id: string;
  /** display name */
  name: string;
  /** price in cents */
  priceCents: number;
  /** whether the widget is orderable */
  available: boolean;
  /** free-form labels */
  tags: string[];
}

/** Widget response body */
export interface WidgetBody {
  /** data wrapper */
  data: Widget;
}

/** Widget collection response body */
export interface WidgetListBody {
  /** data wrapper */
  data: Widget[];
}

/** Error body */
export interface ErrorBody {
  /** error name */
  name: string;
  /** error messages */
  messages: string[];
}

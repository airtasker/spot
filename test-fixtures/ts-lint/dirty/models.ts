/** A widget */
export interface Widget {
  /** widget identifier */
  id: string;
  /** display name */
  name: string;
  /** price in cents */
  priceCents: number;
}

/** Widget response body */
export interface WidgetBody {
  /** data wrapper */
      data: Widget;
}

/** Error body */
export interface ErrorBody {
  /** error name */
  name: string;
  /** error messages */
  messages: string[];
}

// Not camelCase or PascalCase: `naming-convention` reports this, and no
// `--fix` can repair it.
const DEFAULT_price = 100;

// `priceCents` is a number, so this is the tree's only type error.
export const sample: Widget = {
  id: 'w-1',
  name: 'Widget',
  priceCents: DEFAULT_price + 'c'
};

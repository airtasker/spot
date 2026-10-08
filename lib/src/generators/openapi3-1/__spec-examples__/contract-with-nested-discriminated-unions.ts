import { api, body, endpoint, Int32, response, String } from "@airtasker/spot";

@api({ name: "contract" })
class Contract {}

@endpoint({
  method: "GET",
  path: "/filters"
})
class NestedDiscriminatedUnions {
  @response({ status: 200 })
  successResponse(@body body: Body) {}
}

interface Toggle {
  kind: "toggle";
  on: boolean;
}

interface SingleSlider {
  kind: "single_slider";
  value: Int32;
}

interface RangeSlider {
  kind: "range_slider";
  min: Int32;
  max: Int32;
}

interface Picker {
  kind: "picker";
  options: String[];
}

interface Labelled {
  label: String;
}

interface Tag {
  kind: "tag";
}

type LabelledTag = Tag & Labelled;

type Slider = SingleSlider | RangeSlider;

type SliderAlias = Slider;

type MaybeSlider = SingleSlider | RangeSlider | null;

type Control = Slider | Picker;

type Filter = Toggle | Slider;

type Left = Toggle | Picker;

type Right = Toggle | Tag;

interface Body {
  filter: Filter;
  nullableFilter: Toggle | Slider | null;
  threeLevels: Toggle | Control;
  alias: Toggle | SliderAlias;
  liftedNull: Toggle | MaybeSlider;
  intersectionLeaf: LabelledTag | Slider;
  inlineMemberWithUnion: { kind: "inline" } | Slider;
  inlineMemberWithNullableUnion: { kind: "inline" } | MaybeSlider;
  // Left and Right share Toggle, so the parser infers no discriminator.
  diamond: Left | Right;
}

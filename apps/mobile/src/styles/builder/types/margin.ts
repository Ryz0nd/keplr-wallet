import {StyledDimension} from './dimension';

export type StyleBuilderMarginAllDefinitions<
  Sizes extends Record<string, StyledDimension>,
> = {
  [K in keyof Sizes as `margin-${string & K}`]: {
    // There is "margin" prop on the styling,
    // but, the "flatten" method overlaps by latter prop
    // in this case, "flatten" makes {margin:0}, {marginBottom:4}, {margin:2} as {margin:2, marginBottom:4}
    // so the result style has the margin bottom.
    // To prevent this problem, just use all margin props to set the margin.
    marginTop: StyledDimension;
    marginBottom: StyledDimension;
    marginLeft: StyledDimension;
    marginRight: StyledDimension;
  };
};

export type StyleBuilderMarginLeftDefinitions<
  Sizes extends Record<string, StyledDimension>,
> = {
  [K in keyof Sizes as `margin-left-${string & K}`]: {
    marginLeft: StyledDimension;
  };
};

export type StyleBuilderMarginRightDefinitions<
  Sizes extends Record<string, StyledDimension>,
> = {
  [K in keyof Sizes as `margin-right-${string & K}`]: {
    marginRight: StyledDimension;
  };
};

export type StyleBuilderMarginTopDefinitions<
  Sizes extends Record<string, StyledDimension>,
> = {
  [K in keyof Sizes as `margin-top-${string & K}`]: {
    marginTop: StyledDimension;
  };
};

export type StyleBuilderMarginBottomDefinitions<
  Sizes extends Record<string, StyledDimension>,
> = {
  [K in keyof Sizes as `margin-bottom-${string & K}`]: {
    marginBottom: StyledDimension;
  };
};

export type StyleBuilderMarginXDefinitions<
  Sizes extends Record<string, StyledDimension>,
> = {
  [K in keyof Sizes as `margin-x-${string & K}`]: {
    marginLeft: StyledDimension;
    marginRight: StyledDimension;
  };
};

export type StyleBuilderMarginYDefinitions<
  Sizes extends Record<string, StyledDimension>,
> = {
  [K in keyof Sizes as `margin-y-${string & K}`]: {
    marginTop: StyledDimension;
    marginBottom: StyledDimension;
  };
};

export type StyleBuilderMarginDefinitions<
  Sizes extends Record<string, StyledDimension>,
> = StyleBuilderMarginAllDefinitions<Sizes> &
  StyleBuilderMarginLeftDefinitions<Sizes> &
  StyleBuilderMarginRightDefinitions<Sizes> &
  StyleBuilderMarginTopDefinitions<Sizes> &
  StyleBuilderMarginBottomDefinitions<Sizes> &
  StyleBuilderMarginXDefinitions<Sizes> &
  StyleBuilderMarginYDefinitions<Sizes>;

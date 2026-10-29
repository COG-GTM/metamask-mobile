const REACT_TRANSITIONAL_ELEMENT = Symbol.for('react.transitional.element');
const REACT_LEGACY_ELEMENT = Symbol.for('react.element');

interface ReactElementLike {
  $$typeof: symbol;
  type: unknown;
  key: string | null;
  props?: Record<string, unknown>;
}

/**
 * Jest 29's pretty-format only recognises `react.element`, but React 19 elements use
 * `react.transitional.element`. Without this, element-valued props (e.g. ScrollView's
 * `refreshControl`) are printed as plain objects including the `_owner` fiber tree.
 * React 19 also exposes `ref` as a regular prop; it is omitted to match React 18 output.
 */
const serializer: jest.SnapshotSerializerPlugin = {
  test: (val) =>
    Boolean(val) &&
    typeof val === 'object' &&
    (val as ReactElementLike).$$typeof === REACT_TRANSITIONAL_ELEMENT,
  serialize: (val, config, indentation, depth, refs, printer) => {
    const reactElement = val as ReactElementLike;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ref, ...props } = reactElement.props ?? {};
    return printer(
      {
        $$typeof: REACT_LEGACY_ELEMENT,
        type: reactElement.type,
        key: reactElement.key,
        props,
      },
      config,
      indentation,
      depth,
      refs,
    );
  },
};

// Jest loads snapshotSerializers via require() without default-export interop.
// eslint-disable-next-line import/no-commonjs
module.exports = serializer;

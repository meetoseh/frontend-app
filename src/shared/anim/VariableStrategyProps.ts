import { MutableRefObject, useEffect, useRef } from 'react';
import {
  Callbacks,
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { defaultEqualityFn } from '../hooks/useMappedValueWithCallbacks';
import { setVWC } from '../lib/setVWC';

/**
 * For components which can be used both using standard react state or
 * via callbacks (to avoid react rerenders), this is a union type which
 * allows the caller to specify which strategy to use. It's more convenient
 * for the callee to use this type rather than always having to promote their
 * props to a ValueWithCallbacks. The useVariableStrategyPropsAsValueWithCallbacks
 * will allow the implementation function to promote it on the callee's behalf.
 */
export type VariableStrategyProps<P> =
  | { type: 'react-rerender'; props: P }
  | { type: 'callbacks'; props: () => P; callbacks: Callbacks<undefined> };

export type UseVariableStrategyPropsAsValueWithCallbacksOpts<P> = {
  /**
   * The equality function to use to decide if the props have actually
   * changed. By default, this is the same equality function used for
   * mapping ValueWithCallbacks, which is always false for objects.
   *
   * It is often convenient to use this to reduce callbacks rather
   * than having each callback check if it really needs to do anything.
   *
   * @param a
   * @param b
   * @returns If the two are equal and thus callbacks can be skipped
   */
  equalityFn?: (a: P, b: P) => boolean;
};

/**
 * Converts a VariablyStrategyProps, which is usually used as the type that's
 * passed in as a prop to a component, into a ValueWithCallbacks, which is
 * a simplified version of the 'callbacks' option, which changes without
 * triggering a react rerender.
 *
 * Example:
 *
 * ```tsx
 * const MyComponent = (
 *   { propsVariableStrategy }: {
 *     propsVariableStrategy: VariableStrategyProps<{ textContent: string }>;
 *   }
 * ): ReactElement => {
 *   const props = useVariableStrategyPropsAsValueWithCallbacks(propsVariableStrategy);
 *   const containerRef = useRef<HTMLDivElement>(null);
 *
 *   useEffect(() => {
 *     props.callbacks.add(render);
 *     render();
 *     return () => {
 *       if (containerRef.current === null) {
 *         return;
 *       }
 *       containerRef.current.textContent = props.get().textContent;
 *     }
 *   })
 *
 *   return <div ref={containerRef} />;
 * };
 *
 * // usage example, using react rerender strategy
 * <MyComponent propsVariableStrategy={{
 *   type: 'react-rerender',
 *   props: { textContent: 'hello' }
 * }} />
 *
 * // alternatively, using callbacks strategy
 * const componentProps = useWritableValueWithCallbacks({ textContent: 'hello' });
 * <MyComponent propsVariableStrategy={{
 *   type: 'callbacks',
 *   props: componentProps.get,
 *   callbacks: componentProps.callbacks
 * }} />
 * ```
 *
 * @param props The variable strategy props to adapt
 * @returns The adapted props using the least common denominator, ValueWithCallbacks
 */
export const useVariableStrategyPropsAsValueWithCallbacks = <P>(
  props: VariableStrategyProps<P>,
  rawOpts?: UseVariableStrategyPropsAsValueWithCallbacksOpts<P>
): ValueWithCallbacks<P> => {
  const optsRef = useRef<
    Required<UseVariableStrategyPropsAsValueWithCallbacksOpts<P>>
  >() as MutableRefObject<
    Required<UseVariableStrategyPropsAsValueWithCallbacksOpts<P>>
  >;
  optsRef.current = Object.assign(
    {
      equalityFn: defaultEqualityFn,
    },
    rawOpts
  );
  const result = useWritableValueWithCallbacks<P>(() =>
    props.type === 'react-rerender' ? props.props : props.props()
  );

  useEffect(() => {
    if (props.type === 'react-rerender') {
      setVWC(result, props.props, optsRef.current.equalityFn);
    }
  }, [props, result]);

  // we don't need to remount when the getter changes as its still required to
  // invoke or change the callbacks
  const _propsGetterRaw =
    props.type === 'react-rerender' ? undefined : props.props;
  const propsGetterRef = useRef(_propsGetterRaw);
  propsGetterRef.current = _propsGetterRaw;

  const propsCallbacksRaw =
    props.type === 'react-rerender' ? undefined : props.callbacks;

  useEffect(() => {
    if (propsCallbacksRaw === undefined) {
      return;
    }

    const propsCallbacks = propsCallbacksRaw;

    propsCallbacks.add(handleChange);
    handleChange();
    return () => {
      propsCallbacks.remove(handleChange);
    };

    function handleChange() {
      const oldVal = result.get();

      const propsGetterRaw = propsGetterRef.current;
      if (propsGetterRaw === undefined) {
        return;
      }

      const newVal = propsGetterRaw();
      if (optsRef.current.equalityFn(oldVal, newVal)) {
        return;
      }

      result.set(newVal);
      result.callbacks.call(undefined);
    }
  }, [propsCallbacksRaw, result]);

  return result;
};

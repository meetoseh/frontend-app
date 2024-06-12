import { ReactElement, useEffect } from 'react';
import { useWritableValueWithCallbacks } from '../../lib/Callbacks';
import { ConfettiPhysics } from './ConfettiPhysics';
import { setVWC } from '../../lib/setVWC';
import { RenderGuardedComponent } from '../RenderGuardedComponent';
import { View } from 'react-native';

/**
 * Renders the confetti within the given physics engine
 */
export const ConfettiRenderer = ({
  physics,
}: {
  physics: ConfettiPhysics;
}): ReactElement => {
  const elements = useWritableValueWithCallbacks<ReactElement[]>(() => []);
  useEffect(() => {
    const cap = physics.capacity;
    const refs: (View | null)[] = Array(cap).fill(null);
    const newElements = Array.from({ length: cap }, (_, i) => {
      return (
        <View
          style={{ position: 'absolute' }}
          key={i}
          ref={(r) => {
            refs[i] = r;
          }}
        />
      );
    });
    onTick();
    setVWC(elements, newElements);
    physics.callbacks.add(onTick);
    return () => {
      physics.callbacks.remove(onTick);
    };

    function onTick() {
      for (let i = 0; i < cap; i++) {
        const ref = refs[i];
        if (ref === null) {
          continue;
        }

        if (physics.widths[i] === 0) {
          ref.setNativeProps({ style: { display: 'none' } });
          continue;
        }

        ref.setNativeProps({
          style: {
            display: 'block',
            width: physics.widths[i],
            height: physics.heights[i],
            borderRadius: physics.borderRadii[i],
            backgroundColor: physics.colors[i],
            left: physics.xs[i] - physics.box.left,
            top: physics.ys[i] - physics.box.top,
            transform: [
              { rotateX: `${physics.rotationXs[i]}rad` },
              { rotateY: `${physics.rotationYs[i]}rad` },
              { rotateZ: `${physics.rotationZs[i]}rad` },
            ],
          },
        });
      }
    }
  }, [physics, elements]);

  return (
    <RenderGuardedComponent
      props={elements}
      component={(e) => (
        <View
          style={{
            position: 'absolute',
            overflow: 'hidden',
            left: physics.box.left,
            top: physics.box.top,
            width: physics.box.width,
            height: physics.box.height,
          }}
        >
          {e}
        </View>
      )}
    />
  );
};

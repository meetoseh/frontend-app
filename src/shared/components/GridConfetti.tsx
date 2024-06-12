import { ReactElement } from 'react';
import { ValueWithCallbacks } from '../lib/Callbacks';
import { Confetti } from './confetti/Confetti';
import { RenderGuardedComponent } from './RenderGuardedComponent';
import { Platform, View } from 'react-native';

/**
 * An element which fills the background using grid-area: 1 / 1 / -1 / -1
 * and adds confetti
 */
export const GridConfetti = ({
  windowSizeImmediate,
}: {
  windowSizeImmediate: ValueWithCallbacks<{ width: number; height: number }>;
}): ReactElement => {
  const { capacity, rotationStyle, durationSeconds, allowCircles } =
    Platform.select({
      ios: {
        capacity: 200,
        rotationStyle: 'full' as const,
        durationSeconds: 2,
        allowCircles: true,
      },
      default: {
        capacity: 10,
        rotationStyle: 'simple' as const,
        durationSeconds: 10,
        allowCircles: false,
      },
    });
  return (
    <RenderGuardedComponent
      props={windowSizeImmediate}
      component={(size) => (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size.width,
            height: size.height,
          }}
          pointerEvents="none"
        >
          <Confetti
            wind={{
              x: -5,
              y: 200,
            }}
            box={{
              left: 0,
              top: 0,
              width: size.width,
              height: size.height,
            }}
            capacity={capacity}
            position={{
              x: {
                min: size.width * 0.3,
                max: size.width * 0.6,
              },
              y: {
                min: size.height * 0.9,
                max: size.height,
              },
            }}
            velocity={{
              x: {
                min: -100,
                max: 100,
              },
              y: {
                min: -500,
                max: -200,
              },
            }}
            acceleration={{
              x: {
                min: -0.3,
                max: 0.3,
              },
              y: {
                min: 0.1,
                max: -0.1,
              },
            }}
            rotation={{
              x:
                rotationStyle === 'full'
                  ? {
                      min: -Math.PI,
                      max: Math.PI,
                    }
                  : { min: 0, max: 0 },
              y:
                rotationStyle === 'full'
                  ? {
                      min: -Math.PI,
                      max: Math.PI,
                    }
                  : { min: 0, max: 0 },
              z:
                rotationStyle === 'full'
                  ? {
                      min: -Math.PI,
                      max: Math.PI,
                    }
                  : { min: -Math.PI, max: Math.PI },
            }}
            rotationVelocity={{
              x:
                rotationStyle === 'full'
                  ? {
                      min: -10,
                      max: 10,
                    }
                  : { min: 0, max: 0 },
              y:
                rotationStyle === 'full'
                  ? {
                      min: -10,
                      max: 10,
                    }
                  : { min: 0, max: 0 },
              z:
                rotationStyle === 'full'
                  ? {
                      min: -10,
                      max: 10,
                    }
                  : { min: -10, max: 10 },
            }}
            spawnChance={capacity}
            spawnChanceVelocity={-capacity / durationSeconds}
            allowCircles={allowCircles}
          />
        </View>
      )}
    />
  );
};

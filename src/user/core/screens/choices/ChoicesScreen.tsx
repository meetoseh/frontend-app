import { createWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { OsehScreen } from '../../models/Screen';
import { convertScreenConfigurableTriggerWithOldVersion } from '../../models/ScreenConfigurableTrigger';
import { Choices } from './Choices';
import { ChoicesAPIParams, ChoicesMappedParams } from './ChoicesParams';
import { ChoicesResources } from './ChoicesResources';

/**
 * Allows the user to choose amongst a list of options
 */
export const ChoicesScreen: OsehScreen<
  'choices',
  ChoicesResources,
  ChoicesAPIParams,
  ChoicesMappedParams
> = {
  slug: 'choices',
  paramMapper: (params) => ({
    ...params,
    trigger: convertScreenConfigurableTriggerWithOldVersion(
      params.trigger,
      params.triggerv75
    ),
    includeChoice: params.include_choice,
    __mapped: true,
  }),
  initInstanceResources: () => {
    return {
      ready: createWritableValueWithCallbacks(true),
      dispose: () => {},
    };
  },
  component: (props) => <Choices {...props} />,
};

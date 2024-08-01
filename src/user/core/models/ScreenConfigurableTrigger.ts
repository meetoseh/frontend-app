import {
  convertUsingMapper,
  CrudFetcherMapper,
} from '../../../shared/lib/CrudFetcher';

export type ScreenConfigurableTriggerFlowAPI = {
  /**
   * - `flow`: trigger a client flow while popping the screen
   */
  type: 'flow';
  /** The client flow slug to trigger */
  flow: string;
  /** the endpoint to use to trigger the flow or null for the default */
  endpoint: string | null;
  /** the parameters to pass to the flow; null/undefined is treated like an empty object */
  parameters: object | null | undefined;
};

/** Standard pop without a trigger on the standard endpoint */
export type ScreenConfigurableTriggerPopAPI = {
  /**
   * - `pop`: just pop the screen without any trigger
   */
  type: 'pop';
};

export type ScreenConfigurableTriggerAPI =
  | ScreenConfigurableTriggerFlowAPI
  | ScreenConfigurableTriggerPopAPI;

export type ScreenConfigurableTriggerFlow = Omit<
  ScreenConfigurableTriggerFlowAPI,
  'parameters'
> & {
  /** the parameters to pass to the flow; undefined is treated like an empty object */
  parameters: object | null;
};
export const screenConfigurableTriggerFlowMapper: CrudFetcherMapper<
  ScreenConfigurableTriggerFlow
> = (raw) => {
  return {
    ...raw,
    parameters: raw.parameters ?? null,
  };
};

export type ScreenConfigurableTriggerPop = ScreenConfigurableTriggerPopAPI;
export const screenConfigurableTriggerPopMapper: CrudFetcherMapper<
  ScreenConfigurableTriggerPop
> = (raw) => raw;

export type ScreenConfigurableTrigger =
  | ScreenConfigurableTriggerFlow
  | ScreenConfigurableTriggerPop;
export const screenConfigurableTriggerMapper: CrudFetcherMapper<
  ScreenConfigurableTrigger
> = (raw) => {
  if (raw.type === 'flow') {
    return screenConfigurableTriggerFlowMapper(raw);
  } else if (raw.type === 'pop') {
    return screenConfigurableTriggerPopMapper(raw);
  } else {
    console.warn(
      'unknown screen configurable trigger, treating like pop:',
      raw
    );
    return { type: 'pop' };
  }
};

import { MergeSuggestion } from "./MergeAccountState";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * The state that the merge account feature persists locally
 */
export type MergeAccountStoredState = {
  /**
   * The sub of the user for which we fetched merge suggestions
   */
  userSub: string;
  /**
   * The merge suggestions from the server, where a list is always
   * non-empty and no suggestions is indicated by null.
   */
  mergeSuggestions: MergeSuggestion[] | null;
  /**
   * The date at which we got the merge suggestions from the server
   */
  checkedAt: Date;
};

const mergeAccountStorageKey = "merge-account";

/**
 * Retrieves the currently stored merge account stored state, if there is any
 * any it is valid, otherwise null. This does not check for expiration.
 */
export const getMergeAccountStoredState =
  async (): Promise<MergeAccountStoredState | null> => {
    const raw = await AsyncStorage.getItem(mergeAccountStorageKey);
    if (raw === null) {
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse merge account stored state", e);
      await AsyncStorage.removeItem(mergeAccountStorageKey);
      return null;
    }

    if (typeof parsed !== "object" || parsed === null) {
      console.error("Invalid merge account stored state", parsed);
      await AsyncStorage.removeItem(mergeAccountStorageKey);
      return null;
    }

    if (typeof parsed.userSub !== "string") {
      console.error("Invalid merge account stored state", parsed);
      await AsyncStorage.removeItem(mergeAccountStorageKey);
      return null;
    }

    if (
      !Array.isArray(parsed.mergeSuggestions) &&
      parsed.mergeSuggestions !== null
    ) {
      console.error("Invalid merge account stored state", parsed);
      await AsyncStorage.removeItem(mergeAccountStorageKey);
      return null;
    }

    if (typeof parsed.checkedAt !== "number") {
      console.error("Invalid merge account stored state", parsed);
      await AsyncStorage.removeItem(mergeAccountStorageKey);
      return null;
    }

    return {
      userSub: parsed.userSub,
      mergeSuggestions: parsed.mergeSuggestions,
      checkedAt: new Date(parsed.checkedAt),
    };
  };

/**
 * Stores the given merge account stored state, or removes it if null is given.
 * This does not check for expiration.
 */
export const setMergeAccountStoredState = async (
  state: MergeAccountStoredState | null
): Promise<void> => {
  if (state === null) {
    await AsyncStorage.removeItem(mergeAccountStorageKey);
    return;
  }

  const raw = JSON.stringify({
    userSub: state.userSub,
    mergeSuggestions: state.mergeSuggestions,
    checkedAt: state.checkedAt.getTime(),
  });
  await AsyncStorage.setItem(mergeAccountStorageKey, raw);
};

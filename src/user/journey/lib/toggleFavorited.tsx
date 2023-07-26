import { ReactElement } from "react";
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
} from "../../../shared/lib/Callbacks";
import { setVWC } from "../../../shared/lib/setVWC";
import { LoginContextValue } from "../../../shared/contexts/LoginContext";
import { apiFetch } from "../../../shared/lib/apiFetch";
import { describeError } from "../../../shared/lib/describeError";

/**
 * Toggles the favorited state on the given journey via a server call.
 * It can be more convenient to use useToggleFavorited, which will take
 * care of most of these parameters for you.
 *
 * @param loginContext The logged in user to make the request with
 * @param journey The journey to toggle the favorited state of
 * @param shared The shared state, which includes if its currently favorited.
 * @param showLikedUntilVWC The time (as if by Date.now()) whose value represents
 *   when the liked message should be hidden.
 * @param showUnlikedUntilVWC The time (as if by Date.now()) whose value represents
 *   when the unliked message should be hidden.
 * @param showUnfavoritableUntilVWC The time (as if by Date.now()) whose value represents
 *   when the unfavoritable message should be hidden.
 * @param likeErrorVWC The error to show if there was an error liking/unliking.
 * @param knownUnfavoritable If we know that the journey is not favoritable we can
 *   skip the network request by setting this to true. If we know it is favoritable,
 *   set this to false. If we don't know, this should be undefined.
 */
export const toggleFavorited = async (
  loginContext: LoginContextValue,
  journey: { uid: string },
  shared: ValueWithCallbacks<{
    favorited: boolean | null;
    setFavorited: (v: boolean) => void;
  }>,
  showLikedUntilVWC: WritableValueWithCallbacks<number | undefined>,
  showUnlikedUntilVWC: WritableValueWithCallbacks<number | undefined>,
  showUnfavoritableUntilVWC: WritableValueWithCallbacks<number | undefined>,
  likeErrorVWC: WritableValueWithCallbacks<ReactElement | null>,
  knownUnfavoritable?: boolean | undefined
): Promise<void> => {
  const favorited = shared.get().favorited;
  if (favorited === null) {
    return;
  }

  setVWC(showLikedUntilVWC, undefined);
  setVWC(showUnlikedUntilVWC, undefined);
  setVWC(showUnfavoritableUntilVWC, undefined);
  setVWC(likeErrorVWC, null);

  if (knownUnfavoritable) {
    setVWC(showUnfavoritableUntilVWC, Date.now() + 5000);
    return;
  }

  try {
    const response = await apiFetch(
      "/api/1/users/me/journeys/likes" +
        (favorited ? "?uid=" + encodeURIComponent(journey.uid) : ""),
      favorited
        ? {
            method: "DELETE",
          }
        : {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
              journey_uid: journey.uid,
            }),
          },
      loginContext
    );
    if (!response.ok) {
      if (knownUnfavoritable !== false && response.status === 404) {
        // probably haven't taken the journey yet.
        setVWC(showUnfavoritableUntilVWC, Date.now() + 5000);
        return;
      }

      if (favorited || response.status !== 409) {
        // if we were favoriting and got a 409, it's already favorited,
        // which we can treat as success
        throw response;
      }
    }

    const nowFavorited = !favorited;
    shared.get().setFavorited(nowFavorited);
    if (nowFavorited) {
      setVWC(showLikedUntilVWC, Date.now() + 5000);
    } else {
      setVWC(showUnlikedUntilVWC, Date.now() + 5000);
    }
  } catch (err) {
    const desc = await describeError(err);
    setVWC(likeErrorVWC, desc);
  }
};
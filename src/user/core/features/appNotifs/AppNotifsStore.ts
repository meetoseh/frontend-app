import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Retrieves the last time the user saw our dialog requesting permissions
 * to send notifications, or null if we haven't asked yet.
 */
export const retrieveLastRequestedLocally = async (): Promise<Date | null> => {
  const result = await AsyncStorage.getItem("appNotifs-lastRequestedLocally");
  if (result === null) {
    return null;
  }

  try {
    const timeMS = parseFloat(result);
    return new Date(timeMS);
  } catch (e) {
    console.log(
      `malformed appNotifs-lastRequestedLocally: ${result} - deleting`
    );
    await AsyncStorage.removeItem("appNotifs-lastRequestedLocally");
    return null;
  }
};

/**
 * Sets the last time the user saw our dialog requesting permissions
 * to send notifications.
 *
 * @param date The date to set.
 */
export const setLastRequestedLocally = async (date: Date): Promise<void> => {
  await AsyncStorage.setItem(
    "appNotifs-lastRequestedLocally",
    date.getTime().toString()
  );
};

export type StoredTokenUserAssociation = {
  /**
   * The sub of the user we associated this token with.
   */
  userSub: string;

  /**
   * The expo push token we associated with the user
   */
  expoPushToken: string;

  /**
   * When we associated this token with the user.
   */
  lastAssociatedAt: Date;
};

/**
 * Retrieves the token/user association we last sent to the server, if
 * we have ever sent one.
 *
 * @returns The token/user association, or null if we haven't sent one.
 */
export const retrieveStoredTokenUserAssociation =
  async (): Promise<StoredTokenUserAssociation | null> => {
    const result = await AsyncStorage.getItem("appNotifs-tokenUserAssociation");
    if (result === null) {
      return null;
    }

    try {
      const parsed = JSON.parse(result);
      if (typeof parsed !== "object") {
        throw new Error("not an object");
      }
      if (typeof parsed.userSub !== "string") {
        throw new Error("userSub not a string");
      }
      if (typeof parsed.expoPushToken !== "string") {
        throw new Error("expoPushToken not a string");
      }
      if (typeof parsed.lastAssociatedAt !== "number") {
        throw new Error("lastAssociatedAt not a number");
      }
      return {
        userSub: parsed.userSub,
        expoPushToken: parsed.expoPushToken,
        lastAssociatedAt: new Date(parsed.lastAssociatedAt),
      };
    } catch (e) {
      console.log(
        `malformed appNotifs-tokenUserAssociation (${e}): ${result} - deleting`
      );
      await AsyncStorage.removeItem("appNotifs-tokenUserAssociation");
      return null;
    }
  };

/**
 * Stores the token/user association we last sent to the server.
 *
 * @param association The association to store.
 */
export const storeTokenUserAssociation = async (
  association: StoredTokenUserAssociation
): Promise<void> => {
  await AsyncStorage.setItem(
    "appNotifs-tokenUserAssociation",
    JSON.stringify({
      userSub: association.userSub,
      expoPushToken: association.expoPushToken,
      lastAssociatedAt: association.lastAssociatedAt.getTime(),
    })
  );
};

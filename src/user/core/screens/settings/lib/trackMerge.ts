import { ScreenContext } from '../../../hooks/useScreenContext';

/**
 * A convenience function to track that we may have just merged
 * accounts and need to reset caches
 */
export const trackMerge = async (ctx: ScreenContext): Promise<void> => {
  // evicting immediately is likely useless as reads are likely to be stale
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await doEvict(ctx);
  await new Promise((resolve) => setTimeout(resolve, 8000));
  await doEvict(ctx);
  await new Promise((resolve) => setTimeout(resolve, 10000));
  await doEvict(ctx);
};

const doEvict = async (ctx: ScreenContext): Promise<void> => {
  ctx.resources.sessionStateHandler.evictAll();
  ctx.resources.seriesLikeStateHandler.evictAll();
  ctx.resources.seriesJourneysHandler.evictAll();
  ctx.resources.purchaseOfferingsHandler.evictAll();
  ctx.resources.offeringHandler.evictAll();
  ctx.resources.priceHandler.evictAll();
  ctx.resources.journeyShareLinkHandler.evictAll();
  ctx.resources.journeyLikeStateHandler.evictAll();
  ctx.resources.homeCopyHandler.evictAll();
  ctx.resources.homeImageHandler.evictAll();
  ctx.resources.profilePictureHandler.evictAll();
  ctx.resources.streakHandler.evictAll();
  ctx.resources.emotionsHandler.evictAll();
  ctx.resources.identitiesHandler.evictAll();
  ctx.resources.entitlementsHandler.evictAll();
  ctx.resources.favoritesListHandler.evictAll();
  ctx.resources.historyListHandler.evictAll();
  ctx.resources.ownedListHandler.evictAll();
  ctx.resources.manageMembershipUrlHandler.evictAll();
  ctx.resources.reminderChannelsHandler.evictAll();
  ctx.resources.reminderSettingsHandler.evictAll();
  ctx.resources.expoTokenSyncHandler.evictAll();
};

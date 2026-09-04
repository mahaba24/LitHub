// Completed returns are weighted well above reviews: a track record of
// actually returning borrowed books is the strongest signal this app can
// observe directly, while reviews are self-reported and easier to game.
// completedReturns is capped at a target of 10 (returns beyond that don't
// keep raising the score) and blended 70/30 against the 1-5 star average.
const RETURNS_TARGET = 10;
const RETURNS_WEIGHT = 70;
const REVIEWS_WEIGHT = 30;

export function computeTrustScore({
  completedReturns,
  averageRating,
}: {
  completedReturns: number;
  averageRating: number;
}): number {
  const returnsComponent = Math.min(completedReturns / RETURNS_TARGET, 1);
  const reviewsComponent = averageRating / 5;
  const score = RETURNS_WEIGHT * returnsComponent + REVIEWS_WEIGHT * reviewsComponent;
  return Math.round(score);
}

export function calculateMatch(user, game) {
  const distance =
    Math.abs(user.challenge - game.challenge) +
    Math.abs(user.exploration - game.exploration) +
    Math.abs(user.social - game.social) +
    Math.abs(user.creativity - game.creativity) +
    Math.abs(user.narrative - game.narrative);

  const maxDistance = 500;

  return Math.round(
    ((maxDistance - distance) / maxDistance) * 100
  );
}
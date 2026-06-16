function calculateMatch(user, otherUser) {
  const distance =
    Math.abs(user.challenge - otherUser.challenge) +
    Math.abs(user.exploration - otherUser.exploration) +
    Math.abs(user.social - otherUser.social) +
    Math.abs(user.creativity - otherUser.creativity) +
    Math.abs(user.narrative - otherUser.narrative);

  const maxDistance = 500;

  return Math.round(
    ((maxDistance - distance) / maxDistance) * 100
  );
}

module.exports = calculateMatch;
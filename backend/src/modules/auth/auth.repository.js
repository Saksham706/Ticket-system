const {
  OtpChallenge,
  RefreshSession,
} = require("./auth.model");

const createOtpChallenge = (data) =>
  OtpChallenge.create(data);

const findLatestOtpChallenge = (userId, purpose) =>
  OtpChallenge.findOne({
    user: userId,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .select("+otpHash")
    .sort({ createdAt: -1 });

const invalidateOtpChallenges = (userId, purpose) =>
  OtpChallenge.updateMany(
    {
      user: userId,
      purpose,
      consumedAt: null,
    },
    {
      $set: { consumedAt: new Date() },
    }
  );

const consumeOtpChallenge = (challengeId) =>
  OtpChallenge.findOneAndUpdate(
    {
      _id: challengeId,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: { consumedAt: new Date() },
    },
    { new: true }
  );

const createRefreshSession = (data) =>
  RefreshSession.create(data);

const findRefreshSession = (tokenHash) =>
  RefreshSession.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .select("+tokenHash")
    .populate("user");

const revokeRefreshSession = (sessionId) =>
  RefreshSession.findByIdAndUpdate(
    sessionId,
    { $set: { revokedAt: new Date() } },
    { new: true }
  );

const revokeAllUserSessions = (userId) =>
  RefreshSession.updateMany(
    {
      user: userId,
      revokedAt: null,
    },
    {
      $set: { revokedAt: new Date() },
    }
  );

module.exports = {
  createOtpChallenge,
  findLatestOtpChallenge,
  invalidateOtpChallenges,
  consumeOtpChallenge,
  createRefreshSession,
  findRefreshSession,
  revokeRefreshSession,
  revokeAllUserSessions,
};
export const SECURITY_FIXTURES = {
  users: {
    requestingUser: { id: "user-internal-001", publicId: "pub-user-001", username: "bob_secure" },
    vulnerableTarget: {
      id: "user-internal-999",
      publicId: "pub-user-999",
      username: "alice_leak",
      displayName: "Alice Leak",
      email: "alice@vulnerable-leak.com",
      status: "ONLINE",
      avatarUrl: "/avatars/leak.png",
      passwordHash: "$2b$12$VulnerableHashPatternHereDoNotExposeToClient"
    }
  },
  contacts: {
    acceptedRelation: { senderId: "user-internal-001", receiverId: "user-internal-999", status: "ACCEPTED" },
    strangerRelation: { senderId: "user-internal-777", receiverId: "user-internal-999", status: "PENDING" }
  }
};

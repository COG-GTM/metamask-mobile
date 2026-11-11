package io.metamask.nativesdk

data class SessionOwner(val identity: String, val boundAt: Long)

interface SessionOwnerStore {
  fun get(sessionId: String): SessionOwner?
  fun all(): Map<String, SessionOwner>
  fun put(sessionId: String, owner: SessionOwner)
  fun remove(sessionId: String)
}

/**
 * Binds each SDK session id to the identity (packages + signing certificates) of the app that first
 * used it. Later messages for that session are only accepted from the same identity, so knowing a
 * session id is not enough to act under another dapp's approved connection. Bindings are never
 * evicted: a session that loses its binding could be claimed by another app.
 */
class SessionOwnerRegistry(
  private val store: SessionOwnerStore,
  private val maxSessionsPerIdentity: Int = DEFAULT_MAX_SESSIONS_PER_IDENTITY,
  private val clock: () -> Long = System::currentTimeMillis,
) {
  @Synchronized
  fun ownerOf(sessionId: String): String? = store.get(sessionId)?.identity

  /** Returns true if [identity] owns [sessionId], binding it first if the session is unowned. */
  @Synchronized
  fun bind(sessionId: String, identity: String): Boolean {
    if (sessionId.isEmpty() || identity.isEmpty()) {
      return false
    }
    store.get(sessionId)?.let { return it.identity == identity }
    if (store.all().count { it.value.identity == identity } >= maxSessionsPerIdentity) {
      return false
    }
    store.put(sessionId, SessionOwner(identity, clock()))
    return true
  }

  companion object {
    const val DEFAULT_MAX_SESSIONS_PER_IDENTITY = 32
  }
}

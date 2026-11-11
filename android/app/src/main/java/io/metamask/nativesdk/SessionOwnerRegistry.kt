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
 * session id is not enough to act under another dapp's approved connection. When an app reaches
 * [maxSessionsPerIdentity], its oldest binding is evicted; a later claim of an evicted session is a
 * new binding, for which the wallet drops the old connection and asks for approval again. Until the
 * wallet process restarts (which drops any reply still in flight), an evicted session can only be
 * reclaimed by its previous owner.
 */
class SessionOwnerRegistry(
  private val store: SessionOwnerStore,
  private val maxSessionsPerIdentity: Int = DEFAULT_MAX_SESSIONS_PER_IDENTITY,
  private val clock: () -> Long = System::currentTimeMillis,
) {
  private val evictedOwners = HashMap<String, String>()
  private val evictedByIdentity = HashMap<String, ArrayDeque<String>>()

  @Synchronized
  fun ownerOf(sessionId: String): String? = store.get(sessionId)?.identity

  /** Returns true if [identity] owns [sessionId], binding it first if the session is unowned. */
  @Synchronized
  fun bind(sessionId: String, identity: String): Boolean {
    if (sessionId.isEmpty() || identity.isEmpty()) {
      return false
    }
    store.get(sessionId)?.let { return it.identity == identity }
    evictedOwners[sessionId]?.let { previous ->
      if (previous != identity) {
        return false
      }
      evictedOwners.remove(sessionId)
      evictedByIdentity[previous]?.remove(sessionId)
    }
    val owned = store.all().filterValues { it.identity == identity }
    owned.entries
      .sortedBy { it.value.boundAt }
      .take(maxOf(0, owned.size - maxSessionsPerIdentity + 1))
      .forEach { evict(it.key, identity) }
    store.put(sessionId, SessionOwner(identity, clock()))
    return true
  }

  private fun evict(sessionId: String, identity: String) {
    store.remove(sessionId)
    val evicted = evictedByIdentity.getOrPut(identity) { ArrayDeque() }
    evicted.addLast(sessionId)
    evictedOwners[sessionId] = identity
    while (evicted.size > maxSessionsPerIdentity) {
      evictedOwners.remove(evicted.removeFirst())
    }
  }

  companion object {
    const val DEFAULT_MAX_SESSIONS_PER_IDENTITY = 32
  }
}

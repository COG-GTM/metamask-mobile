package io.metamask.nativesdk

import android.content.Context
import android.content.SharedPreferences

internal data class SessionBinding(val ownerPackage: String, val lastUsedMs: Long)

internal interface SessionOwnerStorage {
    fun all(): Map<String, SessionBinding>
    fun get(sessionId: String): SessionBinding?
    fun put(sessionId: String, binding: SessionBinding)
    fun remove(sessionIds: Collection<String>)
}

private class SharedPreferencesOwnerStorage(private val prefs: SharedPreferences) : SessionOwnerStorage {
    private fun decode(value: Any?): SessionBinding? {
        val raw = value as? String ?: return null
        val sep = raw.indexOf(':')
        if (sep <= 0) return null
        val lastUsed = raw.substring(0, sep).toLongOrNull() ?: return null
        return SessionBinding(raw.substring(sep + 1), lastUsed)
    }

    override fun all(): Map<String, SessionBinding> =
        prefs.all.mapNotNull { (k, v) -> decode(v)?.let { k to it } }.toMap()

    override fun get(sessionId: String): SessionBinding? = decode(prefs.getString(sessionId, null))

    override fun put(sessionId: String, binding: SessionBinding) {
        prefs.edit().putString(sessionId, "${binding.lastUsedMs}:${binding.ownerPackage}").apply()
    }

    override fun remove(sessionIds: Collection<String>) {
        val editor = prefs.edit()
        sessionIds.forEach { editor.remove(it) }
        editor.apply()
    }
}

/**
 * Persists which calling package owns each SDK session id so a session id
 * observed or guessed by another installed app cannot be replayed by it.
 *
 * Bindings unused for [expiryMs] are pruned, and each package keeps at most
 * [maxSessionsPerPackage] bindings (its least recently used one is evicted),
 * so storage stays bounded without permanently blocking new sessions.
 */
internal class SessionBindingStore(
    private val storage: SessionOwnerStorage,
    private val maxSessionsPerPackage: Int = MAX_SESSIONS_PER_PACKAGE,
    private val maxSessions: Int = MAX_SESSIONS,
    private val expiryMs: Long = BINDING_EXPIRY_MS,
    private val clock: () -> Long = System::currentTimeMillis,
) {
    constructor(context: Context) : this(
        SharedPreferencesOwnerStorage(
            context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE),
        ),
    )

    /**
     * Returns the package that owns [sessionId] if one of [callerPackages] owns it
     * (binding it to the caller on first use), or null if the caller must be rejected.
     */
    @Synchronized
    fun bindOrVerify(sessionId: String, callerPackages: Set<String>): String? {
        if (sessionId.isBlank() || callerPackages.isEmpty()) return null
        val now = clock()
        storage.get(sessionId)?.let { existing ->
            if (now - existing.lastUsedMs <= expiryMs) {
                if (existing.ownerPackage !in callerPackages) return null
                if (now - existing.lastUsedMs > TOUCH_INTERVAL_MS) {
                    storage.put(sessionId, existing.copy(lastUsedMs = now))
                }
                return existing.ownerPackage
            }
        }

        var bindings = storage.all()
        val expired = bindings.filterValues { now - it.lastUsedMs > expiryMs }.keys
        if (expired.isNotEmpty()) {
            storage.remove(expired)
            bindings = bindings - expired
        }

        val owner = callerPackages.sorted().first()
        val ownBindings = bindings.filterValues { it.ownerPackage == owner }
        if (ownBindings.size >= maxSessionsPerPackage) {
            // Only the caller's own bindings are evicted, never another app's.
            val evict = ownBindings.entries
                .sortedBy { it.value.lastUsedMs }
                .take(ownBindings.size - maxSessionsPerPackage + 1)
                .map { it.key }
            storage.remove(evict)
            bindings = bindings - evict.toSet()
        }
        if (bindings.size >= maxSessions) return null

        storage.put(sessionId, SessionBinding(owner, now))
        return owner
    }

    companion object {
        private const val PREFS_NAME = "io.metamask.nativesdk.session_bindings"
        private const val TOUCH_INTERVAL_MS = 60 * 60 * 1000L
        const val MAX_SESSIONS_PER_PACKAGE = 20
        const val MAX_SESSIONS = 500
        const val BINDING_EXPIRY_MS = 30L * 24 * 60 * 60 * 1000
    }
}

package io.metamask.nativesdk

import android.content.Context
import android.content.SharedPreferences

internal interface SessionOwnerStorage {
    fun owners(): Map<String, String>
    fun get(sessionId: String): String?
    fun put(sessionId: String, ownerPackage: String)
    fun remove(sessionId: String)
}

private val TIMESTAMP_PREFIX = Regex("^\\d+:")

/** Package names cannot contain ':', so tolerate a `<millis>:` prefix from older values. */
internal fun decodeOwnerPackage(raw: String?): String? =
    raw?.replace(TIMESTAMP_PREFIX, "")?.takeIf { it.isNotEmpty() && ':' !in it }

private class SharedPreferencesOwnerStorage(private val prefs: SharedPreferences) : SessionOwnerStorage {
    override fun owners(): Map<String, String> =
        prefs.all.mapNotNull { (k, v) -> decodeOwnerPackage(v as? String)?.let { k to it } }.toMap()

    override fun get(sessionId: String): String? = decodeOwnerPackage(prefs.getString(sessionId, null))

    override fun put(sessionId: String, ownerPackage: String) {
        prefs.edit().putString(sessionId, ownerPackage).apply()
    }

    override fun remove(sessionId: String) {
        prefs.edit().remove(sessionId).apply()
    }
}

/**
 * Persists which calling package owns each SDK session id so a session id
 * observed or guessed by another installed app cannot be replayed by it.
 *
 * Bindings are never expired or evicted implicitly (that would let another app
 * claim a still-approved session); they are released via [remove] when the
 * wallet removes or rejects the connection.
 */
internal class SessionBindingStore(
    private val storage: SessionOwnerStorage,
    private val maxSessionsPerPackage: Int = MAX_SESSIONS_PER_PACKAGE,
    private val maxSessions: Int = MAX_SESSIONS,
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
        storage.get(sessionId)?.let { owner ->
            return owner.takeIf { it in callerPackages }
        }
        val owners = storage.owners()
        val owner = callerPackages.sorted().first()
        if (owners.size >= maxSessions || owners.values.count { it == owner } >= maxSessionsPerPackage) {
            return null
        }
        storage.put(sessionId, owner)
        return owner
    }

    /** Releases [sessionId]; when [expectedOwner] is set, only if that package owns it. */
    @Synchronized
    fun remove(sessionId: String, expectedOwner: String? = null) {
        if (sessionId.isBlank()) return
        if (expectedOwner != null && storage.get(sessionId) != expectedOwner) return
        storage.remove(sessionId)
    }

    @Synchronized
    fun bindOrVerifyOwner(sessionId: String): String? = storage.get(sessionId)

    /** Drops bindings for sessions the wallet no longer has a connection for. */
    @Synchronized
    fun retainOnly(sessionIds: Set<String>) {
        storage.owners().keys.filter { it !in sessionIds }.forEach { storage.remove(it) }
    }

    companion object {
        private const val PREFS_NAME = "io.metamask.nativesdk.session_bindings"
        const val MAX_SESSIONS_PER_PACKAGE = 50
        const val MAX_SESSIONS = 1000
    }
}

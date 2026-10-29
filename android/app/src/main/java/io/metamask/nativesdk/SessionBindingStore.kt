package io.metamask.nativesdk

import android.content.Context
import android.content.SharedPreferences

internal interface SessionOwnerStorage {
    fun owners(): Map<String, String>
    fun get(sessionId: String): String?
    fun put(sessionId: String, ownerPackage: String)
}

private class SharedPreferencesOwnerStorage(private val prefs: SharedPreferences) : SessionOwnerStorage {
    override fun owners(): Map<String, String> =
        prefs.all.mapNotNull { (k, v) -> (v as? String)?.let { k to it } }.toMap()

    override fun get(sessionId: String): String? = prefs.getString(sessionId, null)

    override fun put(sessionId: String, ownerPackage: String) {
        prefs.edit().putString(sessionId, ownerPackage).apply()
    }
}

/**
 * Persists which calling package owns each SDK session id so a session id
 * observed or guessed by another installed app cannot be replayed by it.
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

    companion object {
        private const val PREFS_NAME = "io.metamask.nativesdk.session_bindings"
        const val MAX_SESSIONS_PER_PACKAGE = 20
        const val MAX_SESSIONS = 500
    }
}

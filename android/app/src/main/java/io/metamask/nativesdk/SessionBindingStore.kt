package io.metamask.nativesdk

import android.content.Context

/**
 * Persists which calling package owns each SDK session id so a session id
 * observed or guessed by another installed app cannot be replayed by it.
 */
internal class SessionBindingStore(context: Context) {
    private val prefs = context.applicationContext
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    @Synchronized
    fun bindOrVerify(sessionId: String, callerPackages: Set<String>): Boolean {
        if (sessionId.isBlank() || callerPackages.isEmpty()) return false
        val owner = prefs.getString(sessionId, null)
        if (owner == null) {
            prefs.edit().putString(sessionId, callerPackages.sorted().first()).apply()
            return true
        }
        return owner in callerPackages
    }

    @Synchronized
    fun remove(sessionId: String) {
        prefs.edit().remove(sessionId).apply()
    }

    companion object {
        private const val PREFS_NAME = "io.metamask.nativesdk.session_bindings"
    }
}

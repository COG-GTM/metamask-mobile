package io.metamask.nativesdk

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class SessionBindingStoreTest {
    private class InMemoryStorage : SessionOwnerStorage {
        val map = LinkedHashMap<String, String>()
        override fun owners(): Map<String, String> = map.toMap()
        override fun get(sessionId: String): String? = map[sessionId]
        override fun put(sessionId: String, ownerPackage: String) {
            map[sessionId] = ownerPackage
        }
    }

    @Test
    fun bindsSessionToFirstCaller() {
        val storage = InMemoryStorage()
        val store = SessionBindingStore(storage)

        assertEquals("io.dapp", store.bindOrVerify("session-1", setOf("io.dapp")))
        assertEquals("io.dapp", storage.map["session-1"])
    }

    @Test
    fun acceptsOwnerAgain() {
        val store = SessionBindingStore(InMemoryStorage())
        store.bindOrVerify("session-1", setOf("io.dapp"))

        assertEquals("io.dapp", store.bindOrVerify("session-1", setOf("io.dapp")))
    }

    @Test
    fun rejectsOtherPackageForBoundSession() {
        val store = SessionBindingStore(InMemoryStorage())
        store.bindOrVerify("session-1", setOf("io.dapp"))

        assertNull(store.bindOrVerify("session-1", setOf("io.attacker")))
    }

    @Test
    fun bindingSurvivesNewStoreInstance() {
        val storage = InMemoryStorage()
        SessionBindingStore(storage).bindOrVerify("session-1", setOf("io.dapp"))

        assertNull(SessionBindingStore(storage).bindOrVerify("session-1", setOf("io.attacker")))
    }

    @Test
    fun rejectsBlankSessionOrUnknownCaller() {
        val store = SessionBindingStore(InMemoryStorage())

        assertNull(store.bindOrVerify("", setOf("io.dapp")))
        assertNull(store.bindOrVerify("session-1", emptySet()))
    }

    @Test
    fun capsNewSessionsPerPackage() {
        val storage = InMemoryStorage()
        val store = SessionBindingStore(storage, maxSessionsPerPackage = 2, maxSessions = 10)
        store.bindOrVerify("a", setOf("io.spam"))
        store.bindOrVerify("b", setOf("io.spam"))

        assertNull(store.bindOrVerify("c", setOf("io.spam")))
        assertEquals("io.dapp", store.bindOrVerify("d", setOf("io.dapp")))
        assertEquals("io.spam", store.bindOrVerify("a", setOf("io.spam")))
    }

    @Test
    fun capsTotalSessions() {
        val store = SessionBindingStore(InMemoryStorage(), maxSessionsPerPackage = 10, maxSessions = 1)
        store.bindOrVerify("a", setOf("io.dapp"))

        assertNull(store.bindOrVerify("b", setOf("io.other")))
    }
}

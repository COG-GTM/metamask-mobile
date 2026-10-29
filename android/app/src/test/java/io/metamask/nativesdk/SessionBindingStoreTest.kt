package io.metamask.nativesdk

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SessionBindingStoreTest {
    private class InMemoryStorage : SessionOwnerStorage {
        val map = LinkedHashMap<String, SessionBinding>()
        override fun all(): Map<String, SessionBinding> = map.toMap()
        override fun get(sessionId: String): SessionBinding? = map[sessionId]
        override fun put(sessionId: String, binding: SessionBinding) {
            map[sessionId] = binding
        }
        override fun remove(sessionIds: Collection<String>) {
            sessionIds.forEach { map.remove(it) }
        }
    }

    private var now = 1_000_000L
    private val day = 24 * 60 * 60 * 1000L

    private fun store(
        storage: SessionOwnerStorage = InMemoryStorage(),
        perPackage: Int = 20,
        total: Int = 500,
        expiry: Long = 30 * day,
    ) = SessionBindingStore(storage, perPackage, total, expiry) { now }

    @Test
    fun bindsSessionToFirstCaller() {
        val storage = InMemoryStorage()

        assertEquals("io.dapp", store(storage).bindOrVerify("session-1", setOf("io.dapp")))
        assertEquals("io.dapp", storage.map["session-1"]?.ownerPackage)
    }

    @Test
    fun acceptsOwnerAgain() {
        val store = store()
        store.bindOrVerify("session-1", setOf("io.dapp"))

        assertEquals("io.dapp", store.bindOrVerify("session-1", setOf("io.dapp")))
    }

    @Test
    fun rejectsOtherPackageForBoundSession() {
        val store = store()
        store.bindOrVerify("session-1", setOf("io.dapp"))

        assertNull(store.bindOrVerify("session-1", setOf("io.attacker")))
    }

    @Test
    fun bindingSurvivesNewStoreInstance() {
        val storage = InMemoryStorage()
        store(storage).bindOrVerify("session-1", setOf("io.dapp"))

        assertNull(store(storage).bindOrVerify("session-1", setOf("io.attacker")))
    }

    @Test
    fun rejectsBlankSessionOrUnknownCaller() {
        val store = store()

        assertNull(store.bindOrVerify("", setOf("io.dapp")))
        assertNull(store.bindOrVerify("session-1", emptySet()))
    }

    @Test
    fun evictsOnlyTheCallersOldestBindingAtPackageCap() {
        val storage = InMemoryStorage()
        val store = store(storage, perPackage = 2, total = 10)
        store.bindOrVerify("other", setOf("io.dapp"))
        store.bindOrVerify("a", setOf("io.spam")); now += 1
        store.bindOrVerify("b", setOf("io.spam")); now += 1

        assertEquals("io.spam", store.bindOrVerify("c", setOf("io.spam")))
        assertFalse(storage.map.containsKey("a"))
        assertTrue(storage.map.containsKey("b"))
        assertEquals("io.dapp", storage.map["other"]?.ownerPackage)
    }

    @Test
    fun prunesExpiredBindingsSoNewSessionsAreNotBlocked() {
        val storage = InMemoryStorage()
        val store = store(storage, perPackage = 10, total = 1, expiry = day)
        store.bindOrVerify("a", setOf("io.dapp"))

        assertNull(store.bindOrVerify("b", setOf("io.other")))
        now += 2 * day
        assertEquals("io.other", store.bindOrVerify("b", setOf("io.other")))
        assertFalse(storage.map.containsKey("a"))
    }

    @Test
    fun activeUseKeepsBindingAlive() {
        val storage = InMemoryStorage()
        val store = store(storage, expiry = day)
        store.bindOrVerify("a", setOf("io.dapp"))
        now += day - 1
        store.bindOrVerify("a", setOf("io.dapp"))
        now += day - 1

        assertNull(store.bindOrVerify("a", setOf("io.attacker")))
    }
}

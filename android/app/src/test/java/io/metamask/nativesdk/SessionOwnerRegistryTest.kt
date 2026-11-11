package io.metamask.nativesdk

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SessionOwnerRegistryTest {
  private class InMemoryStore : SessionOwnerStore {
    val entries = LinkedHashMap<String, SessionOwner>()
    override fun get(sessionId: String) = entries[sessionId]
    override fun all(): Map<String, SessionOwner> = entries.toMap()
    override fun put(sessionId: String, owner: SessionOwner) {
      entries[sessionId] = owner
    }
    override fun remove(sessionId: String) {
      entries.remove(sessionId)
    }
  }

  private val acme = "packages=com.acme.swap;signers=aaaa"
  private val mallory = "packages=com.mallory.flashlight;signers=bbbb"

  @Test
  fun bindsSessionToFirstCaller() {
    val registry = SessionOwnerRegistry(InMemoryStore())

    assertTrue(registry.bind("session-1", acme))
    assertTrue(registry.bind("session-1", acme))
  }

  @Test
  fun rejectsSessionUseFromAnotherApp() {
    val registry = SessionOwnerRegistry(InMemoryStore())
    registry.bind("session-1", acme)

    assertFalse(registry.bind("session-1", mallory))
    assertTrue(registry.bind("session-1", acme))
  }

  @Test
  fun rejectsSameNameWithDifferentSigner() {
    val registry = SessionOwnerRegistry(InMemoryStore())
    registry.bind("session-1", acme)

    assertFalse(registry.bind("session-1", "packages=com.acme.swap;signers=cccc"))
  }

  @Test
  fun bindingSurvivesRestart() {
    val store = InMemoryStore()
    SessionOwnerRegistry(store).bind("session-1", acme)

    assertFalse(SessionOwnerRegistry(store).bind("session-1", mallory))
  }

  @Test
  fun rejectsEmptySessionOrIdentity() {
    val registry = SessionOwnerRegistry(InMemoryStore())

    assertFalse(registry.bind("", acme))
    assertFalse(registry.bind("session-1", ""))
  }

  @Test
  fun evictsOldestSessionOfSameIdentityOverLimit() {
    var now = 0L
    val store = InMemoryStore()
    val registry = SessionOwnerRegistry(store, maxSessionsPerIdentity = 2, clock = { now++ })
    registry.bind("mallory-1", mallory)
    registry.bind("acme-1", acme)
    registry.bind("acme-2", acme)

    assertTrue(registry.bind("acme-3", acme))
    assertNull(registry.ownerOf("acme-1"))
    assertEquals(acme, registry.ownerOf("acme-2"))
    assertEquals(acme, registry.ownerOf("acme-3"))
    assertEquals(mallory, registry.ownerOf("mallory-1"))
  }

  @Test
  fun reportsNoOwnerForUnboundSession() {
    val registry = SessionOwnerRegistry(InMemoryStore())

    assertNull(registry.ownerOf("session-1"))
  }
}

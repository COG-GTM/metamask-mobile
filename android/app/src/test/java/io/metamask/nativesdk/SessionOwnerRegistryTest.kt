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

    assertTrue(registry.authorize("session-1", acme))
    assertTrue(registry.authorize("session-1", acme))
  }

  @Test
  fun rejectsSessionUseFromAnotherApp() {
    val registry = SessionOwnerRegistry(InMemoryStore())
    registry.authorize("session-1", acme)

    assertFalse(registry.authorize("session-1", mallory))
    assertTrue(registry.authorize("session-1", acme))
  }

  @Test
  fun rejectsSameNameWithDifferentSigner() {
    val registry = SessionOwnerRegistry(InMemoryStore())
    registry.authorize("session-1", acme)

    assertFalse(registry.authorize("session-1", "packages=com.acme.swap;signers=cccc"))
  }

  @Test
  fun bindingSurvivesRestart() {
    val store = InMemoryStore()
    SessionOwnerRegistry(store).authorize("session-1", acme)

    assertFalse(SessionOwnerRegistry(store).authorize("session-1", mallory))
  }

  @Test
  fun rejectsEmptySessionOrIdentity() {
    val registry = SessionOwnerRegistry(InMemoryStore())

    assertFalse(registry.authorize("", acme))
    assertFalse(registry.authorize("session-1", ""))
  }

  @Test
  fun evictsOldestSessionsOfSameIdentityOnly() {
    val store = InMemoryStore()
    var now = 0L
    val registry = SessionOwnerRegistry(store, maxSessionsPerIdentity = 2, clock = { now++ })
    registry.authorize("mallory-1", mallory)
    registry.authorize("acme-1", acme)
    registry.authorize("acme-2", acme)
    registry.authorize("acme-3", acme)

    assertNull(store.get("acme-1"))
    assertEquals(acme, store.get("acme-3")?.identity)
    assertEquals(mallory, store.get("mallory-1")?.identity)
  }
}

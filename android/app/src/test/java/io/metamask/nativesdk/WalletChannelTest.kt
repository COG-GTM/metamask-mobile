package io.metamask.nativesdk

import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WalletChannelTest {
  private class RecordingWallet : WalletChannel.WalletEndpoint {
    val events = ArrayList<Pair<String, String>>()
    override fun onDappEvent(event: String, data: String) {
      events.add(event to data)
    }
  }

  @After
  fun tearDown() {
    WalletChannel.resetForTest()
  }

  @Test
  fun queuesEventsUntilWalletAttaches() {
    WalletChannel.deliverToWallet("message", "one")
    val wallet = RecordingWallet()

    WalletChannel.attachWallet(wallet)
    WalletChannel.deliverToWallet("message", "two")

    assertEquals(listOf("message" to "one", "message" to "two"), wallet.events)
  }

  @Test
  fun routesWalletMessagesToDappEndpointBySession() {
    val sent = ArrayList<Pair<String, String>>()
    WalletChannel.attachDapps(object : WalletChannel.DappEndpoint {
      override fun sendToDapp(sessionId: String, message: String): Boolean {
        sent.add(sessionId to message)
        return true
      }
    })

    assertTrue(WalletChannel.sendToDapp("session-1", "hello"))
    assertEquals(listOf("session-1" to "hello"), sent)
  }

  @Test
  fun sendToDappFailsWithoutService() {
    assertFalse(WalletChannel.sendToDapp("session-1", "hello"))
  }
}

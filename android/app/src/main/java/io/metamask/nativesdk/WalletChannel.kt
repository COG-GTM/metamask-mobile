package io.metamask.nativesdk

/**
 * In-process channel between [MessageService] (dapp side) and [CommunicationClient] (wallet side).
 * Both live in the wallet process, so nothing here is visible to other apps on the device.
 */
internal object WalletChannel {
  interface WalletEndpoint {
    fun onDappEvent(event: String, data: String)
  }

  interface DappEndpoint {
    fun sendToDapp(sessionId: String, message: String): Boolean
  }

  private const val MAX_PENDING_EVENTS = 100

  private val pendingEvents = ArrayDeque<Pair<String, String>>()
  private var wallet: WalletEndpoint? = null
  private var dapps: DappEndpoint? = null

  fun attachWallet(endpoint: WalletEndpoint) {
    val queued = synchronized(this) {
      wallet = endpoint
      val events = pendingEvents.toList()
      pendingEvents.clear()
      events
    }
    queued.forEach { (event, data) -> endpoint.onDappEvent(event, data) }
  }

  @Synchronized
  fun detachWallet(endpoint: WalletEndpoint) {
    if (wallet === endpoint) {
      wallet = null
    }
  }

  fun deliverToWallet(event: String, data: String) {
    val target = synchronized(this) {
      wallet ?: run {
        if (pendingEvents.size >= MAX_PENDING_EVENTS) {
          pendingEvents.removeFirst()
        }
        pendingEvents.addLast(event to data)
        null
      }
    }
    target?.onDappEvent(event, data)
  }

  @Synchronized
  fun attachDapps(endpoint: DappEndpoint) {
    dapps = endpoint
  }

  @Synchronized
  fun detachDapps(endpoint: DappEndpoint) {
    if (dapps === endpoint) {
      dapps = null
    }
  }

  fun sendToDapp(sessionId: String, message: String): Boolean {
    val target = synchronized(this) { dapps } ?: return false
    return target.sendToDapp(sessionId, message)
  }

  @Synchronized
  internal fun resetForTest() {
    pendingEvents.clear()
    wallet = null
    dapps = null
  }
}

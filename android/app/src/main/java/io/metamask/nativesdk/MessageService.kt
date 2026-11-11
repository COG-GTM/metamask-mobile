package io.metamask.nativesdk

import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.Bundle
import android.os.IBinder
import android.os.Process
import org.json.JSONException
import org.json.JSONObject

/**
 * Bound service native Android dapps (MetaMask Android SDK) connect to.
 *
 * Every Binder call is attributed to the calling UID. Each calling app gets its own callback and
 * key exchange, a session id is bound to the identity of the app that first used it, and requests
 * are handed to the wallet in-process instead of through device-wide broadcasts.
 */
class MessageService : Service(), WalletChannel.DappEndpoint {
  private class DappClient(val uid: Int) {
    val keyExchange = KeyExchange()
    var identity: String? = null
    var callback: IMessegeServiceCallback? = null
    var deathRecipient: IBinder.DeathRecipient? = null
    val pendingWalletEvents = ArrayList<Pair<EventType, String>>()
  }

  private val clients = HashMap<Int, DappClient>()
  private val sessionUids = HashMap<String, Int>()
  private var lastActiveSessionId: String? = null
  private lateinit var sessionOwners: SessionOwnerRegistry

  private val binder = object : IMessegeService.Stub() {
    override fun registerCallback(callback: IMessegeServiceCallback?) {
      val uid = Binder.getCallingUid()
      if (callback == null || uid == Process.myUid()) {
        return
      }
      registerDappCallback(uid, callback)
    }

    override fun sendMessage(message: Bundle?) {
      val uid = Binder.getCallingUid()
      if (message == null || uid == Process.myUid()) {
        return
      }
      val keyExchangeJson = message.getString(KEY_EXCHANGE)
      val messageJson = message.getString(MESSAGE)
      try {
        if (keyExchangeJson != null) {
          handleKeyExchange(uid, keyExchangeJson)
        } else if (messageJson != null) {
          val json = JSONObject(messageJson)
          handleMessage(uid, json.optString("message"), json.optString("id"))
        }
      } catch (e: JSONException) {
        Logger.error("MessageService:: invalid message from uid=$uid: ${e.message}")
      }
    }
  }

  override fun onCreate() {
    super.onCreate()
    sessionOwners = SessionOwnerRegistry(SharedPreferencesSessionOwnerStore(applicationContext))
    WalletChannel.attachDapps(this)
  }

  override fun onBind(intent: Intent?): IBinder = binder

  override fun onDestroy() {
    WalletChannel.detachDapps(this)
    synchronized(this) {
      clients.values.forEach { client ->
        client.deathRecipient?.let { client.callback?.asBinder()?.unlinkToDeath(it, 0) }
        client.callback = null
      }
      sessionUids.clear()
    }
    super.onDestroy()
  }

  private fun registerDappCallback(uid: Int, callback: IMessegeServiceCallback) {
    val client = synchronized(this) { clients.getOrPut(uid) { DappClient(uid) } }
    if (client.identity == null) {
      client.identity = CallerIdentity.of(applicationContext, uid)
    }
    val recipient = IBinder.DeathRecipient { onDappDied(uid, callback) }
    try {
      callback.asBinder().linkToDeath(recipient, 0)
    } catch (e: Exception) {
      Logger.error("MessageService:: dapp uid=$uid died before registering")
      return
    }
    synchronized(this) {
      client.deathRecipient?.let { client.callback?.asBinder()?.unlinkToDeath(it, 0) }
      client.callback = callback
      client.deathRecipient = recipient
    }
    Logger.log("MessageService:: Dapp callback registered for uid=$uid")
  }

  private fun onDappDied(uid: Int, callback: IMessegeServiceCallback) {
    val disconnectedSessions = synchronized(this) {
      val client = clients[uid] ?: return
      if (client.callback?.asBinder() != callback.asBinder()) {
        return
      }
      client.callback = null
      client.deathRecipient = null
      val sessions = sessionUids.filterValues { it == uid }.keys.toList()
      sessions.forEach { sessionUids.remove(it) }
      sessions
    }
    Logger.log("MessageService:: dapp uid=$uid disconnected")
    disconnectedSessions.forEach {
      WalletChannel.deliverToWallet(EventType.CLIENTS_DISCONNECTED.value, it)
    }
  }

  private fun clientFor(uid: Int): DappClient? {
    val client = synchronized(this) { clients[uid] }
    if (client?.callback == null) {
      Logger.error("MessageService:: rejecting call from uid=$uid without a registered callback")
      return null
    }
    return client
  }

  private fun handleKeyExchange(uid: Int, keyExchangeJson: String) {
    val client = clientFor(uid) ?: return
    val json = JSONObject(keyExchangeJson)
    val type = json.optString("type")
    val publicKey = json.optString("public_key")
    if (KeyExchangeMessageType.values().none { it.name == type }) {
      Logger.error("MessageService:: unknown key exchange type from uid=$uid")
      return
    }
    client.keyExchange.nextKeyExchangeMessage(KeyExchangeMessage(type, publicKey))?.let {
      sendToClient(client, KEY_EXCHANGE, keyExchangeJson(it))
    }
    if (type == KeyExchangeMessageType.KEY_HANDSHAKE_SYNACK.name ||
      type == KeyExchangeMessageType.KEY_HANDSHAKE_ACK.name
    ) {
      client.keyExchange.complete()
      val keysExchanged = JSONObject().put("type", EventType.KEYS_EXCHANGED.value).toString()
      sendToClient(client, MESSAGE, client.keyExchange.encrypt(keysExchanged))
      val pending = synchronized(this) {
        val events = client.pendingWalletEvents.toList()
        client.pendingWalletEvents.clear()
        events
      }
      pending.forEach { (event, data) -> WalletChannel.deliverToWallet(event.value, data) }
    }
  }

  private fun handleMessage(uid: Int, message: String, sessionId: String) {
    val client = clientFor(uid) ?: return
    val identity = client.identity
    if (identity == null || !sessionOwners.authorize(sessionId, identity)) {
      Logger.error("MessageService:: rejecting message for a session not owned by uid=$uid")
      return
    }
    val payload = try {
      client.keyExchange.decrypt(message)
    } catch (e: Exception) {
      Logger.error("MessageService:: could not decrypt message from uid=$uid")
      return
    }
    synchronized(this) {
      sessionUids[sessionId] = uid
      lastActiveSessionId = sessionId
    }

    val payloadJson = JSONObject(payload)
    if (payloadJson.optString("originatorInfo").isNotEmpty()) {
      payloadJson.put("clientId", sessionId)
      WalletChannel.deliverToWallet(EventType.CLIENTS_CONNECTED.value, payloadJson.toString())
      return
    }

    val messageJson = JSONObject().put("id", sessionId).put("message", payload).toString()
    if (client.keyExchange.keysExchanged()) {
      WalletChannel.deliverToWallet(EventType.MESSAGE.value, messageJson)
    } else {
      synchronized(this) { client.pendingWalletEvents.add(EventType.MESSAGE to messageJson) }
      val start = KeyExchangeMessage(
        KeyExchangeMessageType.KEY_HANDSHAKE_START.name,
        client.keyExchange.publicKey,
      )
      sendToClient(client, KEY_EXCHANGE, keyExchangeJson(start))
    }
  }

  override fun sendToDapp(sessionId: String, message: String): Boolean {
    val client = synchronized(this) {
      val target = sessionId.ifEmpty { lastActiveSessionId } ?: return false
      sessionUids[target]?.let { clients[it] }
    } ?: return false
    if (!client.keyExchange.keysExchanged()) {
      Logger.log("MessageService:: keys not exchanged with uid=${client.uid}")
      return false
    }
    return sendToClient(client, MESSAGE, client.keyExchange.encrypt(message))
  }

  private fun sendToClient(client: DappClient, key: String, value: String): Boolean {
    val callback = synchronized(this) { client.callback } ?: return false
    return try {
      callback.onMessageReceived(Bundle().apply { putString(key, value) })
      true
    } catch (e: Exception) {
      Logger.error("MessageService:: failed to deliver to uid=${client.uid}: ${e.message}")
      false
    }
  }

  private fun keyExchangeJson(message: KeyExchangeMessage): String =
    JSONObject().put("type", message.type).put("public_key", message.publicKey).toString()
}

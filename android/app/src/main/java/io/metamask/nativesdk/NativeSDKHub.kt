package io.metamask.nativesdk

import android.content.Context
import android.os.Bundle
import android.os.Process
import android.os.RemoteException
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger

/**
 * In-process router between the exported [MessageService] (dapp side) and the
 * React Native [CommunicationClient] (wallet side). Replaces the previous
 * device-wide `local.client` / `local.service` broadcasts.
 *
 * Every dapp is identified by its Binder calling uid. Each uid gets its own key
 * pair and callback, and every session id is bound to the package that first
 * used it; messages for a session from any other caller are dropped.
 */
internal object NativeSDKHub {
    private const val MAX_PENDING_WALLET_EVENTS = 100
    private const val MAX_IN_FLIGHT_PER_CALLER = 64
    private const val KEY_MESSAGE = "message"
    private const val KEY_KEY_EXCHANGE = "key_exchange"

    private class DappClient(val uid: Int, val packages: Set<String>) {
        val keyExchange = KeyExchange()
        var callback: IMessegeServiceCallback? = null
        val pendingMessages = ArrayList<String>()
    }

    // All state below is only touched on this single thread.
    private val executor: ExecutorService = Executors.newSingleThreadExecutor()
    private val clients = HashMap<Int, DappClient>()
    private val sessionOwners = HashMap<String, Int>()
    private val pendingWalletEvents = ArrayDeque<Pair<String, String>>()
    private val inFlightByCaller = ConcurrentHashMap<Int, AtomicInteger>()

    @Volatile
    private var walletListener: ((String, String) -> Unit)? = null
    private var bindingStore: SessionBindingStore? = null

    fun registerCallback(context: Context, uid: Int, callback: IMessegeServiceCallback?) {
        val appContext = context.applicationContext
        submitFromCaller(uid) {
            val client = clientFor(appContext, uid) ?: return@submitFromCaller
            client.callback = callback
        }
    }

    fun onDappKeyExchange(context: Context, uid: Int, json: String) {
        val appContext = context.applicationContext
        submitFromCaller(uid) {
            val client = clientFor(appContext, uid) ?: return@submitFromCaller
            try {
                handleKeyExchange(client, json)
            } catch (e: Exception) {
                Logger.error("NativeSDKHub:: key exchange failed for uid=$uid: ${e.message}")
            }
        }
    }

    fun onDappMessage(context: Context, uid: Int, sessionId: String, encrypted: String) {
        val appContext = context.applicationContext
        submitFromCaller(uid) {
            val client = clientFor(appContext, uid) ?: return@submitFromCaller
            val payload = try {
                client.keyExchange.decrypt(encrypted)
            } catch (e: Exception) {
                Logger.error("NativeSDKHub:: unable to decrypt message from uid=$uid")
                return@submitFromCaller
            }
            val ownerPackage = store(appContext).bindOrVerify(sessionId, client.packages)
            if (ownerPackage == null) {
                Logger.error("NativeSDKHub:: dropping message, session not owned by uid=$uid")
                return@submitFromCaller
            }
            sessionOwners[sessionId] = uid
            try {
                handleMessage(client, sessionId, ownerPackage, payload)
            } catch (e: Exception) {
                Logger.error("NativeSDKHub:: invalid message from uid=$uid: ${e.message}")
            }
        }
    }

    fun setWalletListener(listener: ((String, String) -> Unit)?) {
        walletListener = listener
        if (listener == null) return
        executor.execute {
            val current = walletListener ?: return@execute
            while (pendingWalletEvents.isNotEmpty()) {
                val (event, data) = pendingWalletEvents.removeFirst()
                current(event, data)
            }
        }
    }

    /**
     * Releases the native binding for a session the wallet removed or rejected.
     * With [expectedOwner], only that package's binding is released.
     */
    fun removeSession(context: Context, sessionId: String, expectedOwner: String?) {
        val appContext = context.applicationContext
        executor.execute {
            val store = store(appContext)
            store.remove(sessionId, expectedOwner)
            if (store.bindOrVerifyOwner(sessionId) == null) sessionOwners.remove(sessionId)
        }
    }

    /** Keeps only bindings for sessions the wallet still has connections for. */
    fun retainSessions(context: Context, sessionIds: Set<String>) {
        val appContext = context.applicationContext
        executor.execute {
            store(appContext).retainOnly(sessionIds)
            sessionOwners.keys.retainAll(sessionIds)
        }
    }

    fun isWalletBound(): Boolean = walletListener != null

    /** Sends a wallet response only to the dapp client bound to [sessionId]. */
    fun sendToDapp(sessionId: String, message: String) {
        executor.execute {
            val uid = sessionOwners[sessionId]
            val client = uid?.let { clients[it] }
            if (client == null || !client.keyExchange.keysExchanged) {
                Logger.error("NativeSDKHub:: no authenticated client for session, dropping response")
                return@execute
            }
            try {
                sendToClient(client, KEY_MESSAGE, client.keyExchange.encrypt(message))
            } catch (e: Exception) {
                Logger.error("NativeSDKHub:: failed to send response: ${e.message}")
            }
        }
    }

    /** Drops work from a caller that already has too many queued tasks. */
    private fun submitFromCaller(uid: Int, task: () -> Unit) {
        val inFlight = inFlightByCaller.getOrPut(uid) { AtomicInteger() }
        if (inFlight.incrementAndGet() > MAX_IN_FLIGHT_PER_CALLER) {
            inFlight.decrementAndGet()
            Logger.error("NativeSDKHub:: too many pending requests from uid=$uid, dropping")
            return
        }
        executor.execute {
            try {
                task()
            } finally {
                inFlight.decrementAndGet()
            }
        }
    }

    private fun clientFor(context: Context, uid: Int): DappClient? {
        if (uid == Process.myUid()) return null
        // Resolve packages on every call so a reused uid never inherits another app's keys.
        val packages = context.packageManager.getPackagesForUid(uid)?.toSet().orEmpty()
        val cached = clients[uid]
        if (cached != null && cached.packages == packages) return cached
        if (cached != null) {
            clients.remove(uid)
            sessionOwners.entries.removeAll { it.value == uid }
        }
        if (packages.isEmpty()) {
            Logger.error("NativeSDKHub:: rejecting caller with unknown uid=$uid")
            return null
        }
        return DappClient(uid, packages).also { clients[uid] = it }
    }

    private fun store(context: Context): SessionBindingStore =
        bindingStore ?: SessionBindingStore(context).also { bindingStore = it }

    private fun handleKeyExchange(client: DappClient, json: String) {
        val message = JSONObject(json)
        val type = KeyExchangeMessageType.valueOf(
            message.optString("type", KeyExchangeMessageType.KEY_HANDSHAKE_SYN.name),
        )
        val next = client.keyExchange.nextKeyExchangeMessage(
            KeyExchangeMessage(type.name, message.optString("public_key")),
        )
        if (next != null) {
            val response = JSONObject()
                .put("public_key", next.publicKey)
                .put("type", next.type)
            sendToClient(client, KEY_KEY_EXCHANGE, response.toString())
        }
        if (type == KeyExchangeMessageType.KEY_HANDSHAKE_SYNACK ||
            type == KeyExchangeMessageType.KEY_HANDSHAKE_ACK
        ) {
            client.keyExchange.complete()
            val keysExchanged = JSONObject().put("type", EventType.KEYS_EXCHANGED.value)
            sendToClient(client, KEY_MESSAGE, client.keyExchange.encrypt(keysExchanged.toString()))
            client.pendingMessages.forEach { emitToWallet(EventType.MESSAGE.value, it) }
            client.pendingMessages.clear()
        }
    }

    private fun handleMessage(
        client: DappClient,
        sessionId: String,
        ownerPackage: String,
        payload: String,
    ) {
        val payloadJson = JSONObject(payload)
        if (payloadJson.optString("originatorInfo").isNotEmpty()) {
            payloadJson.put("clientId", sessionId)
            payloadJson.put("callerPackage", ownerPackage)
            emitToWallet(EventType.CLIENTS_CONNECTED.value, payloadJson.toString())
            Analytics.trackEvent(Event.SDK_CONNECTION_ESTABLISHED, sessionId)
            return
        }
        val messageJson = JSONObject()
            .put("id", sessionId)
            .put("callerPackage", ownerPackage)
            .put("message", payload)
            .toString()
        if (client.keyExchange.keysExchanged) {
            emitToWallet(EventType.MESSAGE.value, messageJson)
        } else {
            client.pendingMessages.add(messageJson)
            val start = JSONObject()
                .put("public_key", client.keyExchange.publicKey)
                .put("type", KeyExchangeMessageType.KEY_HANDSHAKE_START.name)
            sendToClient(client, KEY_KEY_EXCHANGE, start.toString())
        }
    }

    private fun emitToWallet(event: String, data: String) {
        val listener = walletListener
        if (listener != null) {
            listener(event, data)
            return
        }
        if (pendingWalletEvents.size >= MAX_PENDING_WALLET_EVENTS) {
            pendingWalletEvents.removeFirst()
        }
        pendingWalletEvents.addLast(event to data)
    }

    private fun sendToClient(client: DappClient, key: String, value: String) {
        val callback = client.callback ?: run {
            Logger.error("NativeSDKHub:: no callback registered for uid=${client.uid}")
            return
        }
        try {
            callback.onMessageReceived(Bundle().apply { putString(key, value) })
        } catch (e: RemoteException) {
            Logger.error("NativeSDKHub:: dapp callback failed: ${e.message}")
        }
    }
}

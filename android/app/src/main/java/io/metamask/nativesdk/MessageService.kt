package io.metamask.nativesdk

import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.Bundle
import android.os.IBinder
import org.json.JSONObject

/**
 * Exported service dapps bind to. The caller identity is always taken from
 * [Binder.getCallingUid], never from the message payload.
 */
class MessageService : Service() {

    private val binder = object : IMessegeService.Stub() {
        override fun registerCallback(callback: IMessegeServiceCallback?) {
            NativeSDKHub.registerCallback(this@MessageService, Binder.getCallingUid(), callback)
        }

        override fun sendMessage(bundle: Bundle?) {
            bundle ?: return
            val uid = Binder.getCallingUid()
            val keyExchange = bundle.getString("key_exchange")
            val message = bundle.getString("message")
            when {
                keyExchange != null ->
                    NativeSDKHub.onDappKeyExchange(this@MessageService, uid, keyExchange)
                message != null -> {
                    val json = try {
                        JSONObject(message)
                    } catch (e: Exception) {
                        Logger.error("MessageService:: invalid message from uid=$uid")
                        return
                    }
                    val id = json.optString("id")
                    val payload = json.optString("message")
                    if (id.isEmpty() || payload.isEmpty()) return
                    NativeSDKHub.onDappMessage(this@MessageService, uid, id, payload)
                }
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder = binder
}

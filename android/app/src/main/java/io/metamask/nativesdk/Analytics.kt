package io.metamask.nativesdk

import okhttp3.Call
import okhttp3.Callback
import okhttp3.FormBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import java.io.IOException

internal enum class Event(val value: String) {
    SDK_CONNECTION_REQUEST_STARTED("sdk_connect_request_started"),
    SDK_CONNECTION_ESTABLISHED("sdk_connection_established"),
    SDK_DISCONNECTED("sdk_disconnected"),
}

internal object Analytics {
    private const val ANALYTICS_URL = "https://metamask-sdk-socket.metafi.codefi.network/debug"
    private val client = OkHttpClient()

    fun trackEvent(event: Event, id: String) {
        val body = FormBody.Builder()
            .add("id", id)
            .add("event", event.value)
            .build()
        val request = Request.Builder().url(ANALYTICS_URL).post(body).build()
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Logger.error("Analytics: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response) {
                response.close()
            }
        })
    }
}

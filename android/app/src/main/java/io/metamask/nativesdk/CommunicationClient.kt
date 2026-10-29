package io.metamask.nativesdk

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * React Native module the wallet uses to talk to SDK dapps. Communicates with
 * [MessageService] in-process through [NativeSDKHub]; no broadcasts are used.
 */
class CommunicationClient(
    private val reactAppContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactAppContext) {

    override fun getName(): String = "CommunicationClient"

    private fun emitToWallet(event: String, data: String) {
        if (!reactAppContext.hasActiveReactInstance()) return
        reactAppContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(event, data)
    }

    @ReactMethod
    fun bindService(promise: Promise) {
        NativeSDKHub.setWalletListener(::emitToWallet)
        promise.resolve(true)
    }

    @ReactMethod
    fun unbindService(promise: Promise) {
        NativeSDKHub.setWalletListener(null)
        promise.resolve(true)
    }

    @ReactMethod
    fun disconnect(promise: Promise) {
        NativeSDKHub.setWalletListener(null)
        promise.resolve(true)
    }

    @ReactMethod
    fun isConnected(promise: Promise) {
        promise.resolve(NativeSDKHub.isWalletBound())
    }

    @ReactMethod
    fun sendMessage(sessionId: String, message: String, promise: Promise) {
        if (sessionId.isEmpty()) {
            promise.reject("INVALID_SESSION", "sessionId is required")
            return
        }
        NativeSDKHub.sendToDapp(sessionId, message)
        promise.resolve(true)
    }

    @ReactMethod
    fun removeSession(sessionId: String, expectedOwner: String?, promise: Promise) {
        NativeSDKHub.removeSession(reactAppContext, sessionId, expectedOwner)
        promise.resolve(true)
    }

    @ReactMethod
    fun retainSessions(sessionIds: ReadableArray, promise: Promise) {
        NativeSDKHub.retainSessions(
            reactAppContext,
            sessionIds.toArrayList().filterIsInstance<String>().toSet(),
        )
        promise.resolve(true)
    }

    override fun invalidate() {
        NativeSDKHub.setWalletListener(null)
        super.invalidate()
    }
}

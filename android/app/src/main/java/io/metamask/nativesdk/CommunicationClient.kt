package io.metamask.nativesdk

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

/** React Native module the wallet uses to talk to native dapps connected to [MessageService]. */
class CommunicationClient(private val reactAppContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactAppContext), WalletChannel.WalletEndpoint {

  @Volatile
  private var isServiceConnected = false
  private var isBound = false

  private val serviceConnection = object : ServiceConnection {
    override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
      Logger.log("CommunicationClient:: Service connected")
      isServiceConnected = true
    }

    override fun onServiceDisconnected(name: ComponentName?) {
      Logger.log("CommunicationClient:: Service disconnected")
      isServiceConnected = false
    }
  }

  override fun getName(): String = "CommunicationClient"

  override fun onDappEvent(event: String, data: String) {
    reactAppContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(event, data)
  }

  override fun invalidate() {
    tearDown()
    super.invalidate()
  }

  @ReactMethod
  fun bindService(promise: Promise) {
    if (isServiceConnected) {
      promise.resolve(true)
      return
    }
    promise.resolve(bind())
  }

  @ReactMethod
  fun unbindService(promise: Promise) {
    unbind()
    promise.resolve(null)
  }

  @ReactMethod
  fun sendMessage(message: String, sessionId: String?, promise: Promise) {
    promise.resolve(null)
    if (!WalletChannel.sendToDapp(sessionId.orEmpty(), message)) {
      Logger.log("CommunicationClient::sendMessage no connected dapp for session")
    }
  }

  @ReactMethod
  fun disconnect(promise: Promise) {
    unbind()
    promise.resolve(null)
  }

  @ReactMethod
  fun isConnected(promise: Promise) {
    promise.resolve(isServiceConnected)
  }

  @Synchronized
  private fun bind(): Boolean {
    WalletChannel.attachWallet(this)
    val intent = Intent(reactAppContext, MessageService::class.java)
    isBound = reactAppContext.bindService(intent, serviceConnection, Context.BIND_IMPORTANT)
    return isBound
  }

  @Synchronized
  private fun unbind() {
    if (isBound) {
      try {
        reactAppContext.unbindService(serviceConnection)
      } catch (e: IllegalArgumentException) {
        Logger.error("CommunicationClient:: service was not bound")
      }
      isBound = false
    }
    isServiceConnected = false
  }

  private fun tearDown() {
    unbind()
    WalletChannel.detachWallet(this)
  }
}

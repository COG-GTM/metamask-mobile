package io.metamask.nativesdk

import android.util.Log

internal const val TAG = "NATIVE_SDK"
internal const val MESSAGE = "message"
internal const val KEY_EXCHANGE = "key_exchange"

internal object Logger {
  fun log(msg: String) {
    Log.d(TAG, msg)
  }

  fun error(msg: String) {
    Log.e(TAG, msg)
  }
}

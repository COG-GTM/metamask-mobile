package io.metamask.nativesdk

import android.util.Log

internal object Logger {
    private const val TAG = "NATIVE_SDK"

    fun log(msg: String) = Log.d(TAG, msg)

    fun error(msg: String) = Log.e(TAG, msg)
}

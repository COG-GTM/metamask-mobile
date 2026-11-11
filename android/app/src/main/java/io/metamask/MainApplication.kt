package io.metamask

import android.app.Application
import android.content.BroadcastReceiver
import android.content.Intent
import android.content.IntentFilter
import android.content.res.Configuration
import android.webkit.WebView
import android.database.CursorWindow

import androidx.core.content.ContextCompat

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

import cl.json.ShareApplication
import io.branch.rnbranch.RNBranchModule
import com.airbnb.android.react.lottie.LottiePackage
import io.metamask.nativeModules.PreventScreenshotPackage
import io.metamask.nativeModules.RCTMinimizerPackage
import io.metamask.nativesdk.NativeSDKPackage
import io.metamask.nativeModules.RNTar.RNTarPackage

class MainApplication : Application(), ShareApplication, ReactApplication {

    override fun getFileProviderAuthority(): String = "${BuildConfig.APPLICATION_ID}.provider"

    override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
        this,
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> {
                val packages = PackageList(this).packages.toMutableList()
                // Add all our custom packages
                packages.add(LottiePackage())
                packages.add(PreventScreenshotPackage())
                packages.add(RCTMinimizerPackage())
                packages.add(NativeSDKPackage())
                packages.add(RNTarPackage())
                return packages
            }

            override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }
    )

    override val reactHost: ReactHost
        get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

    // Libraries that call the two-argument registerReceiver on the application context
    // (e.g. the native SDK's `local.client` / `local.service` receivers) must not be
    // reachable by other apps. System broadcasts and broadcasts scoped to this package
    // are still delivered to non-exported receivers.
    @Suppress("OVERRIDE_DEPRECATION")
    override fun registerReceiver(receiver: BroadcastReceiver?, filter: IntentFilter): Intent? {
        if (receiver == null) {
            return super.registerReceiver(null, filter)
        }
        val flags = if (isCrossAppBroadcastFilter(filter)) {
            ContextCompat.RECEIVER_EXPORTED
        } else {
            ContextCompat.RECEIVER_NOT_EXPORTED
        }
        return ContextCompat.registerReceiver(this, receiver, filter, flags)
    }

    private fun isCrossAppBroadcastFilter(filter: IntentFilter): Boolean {
        if (filter.countActions() == 0) return false
        for (i in 0 until filter.countActions()) {
            if (filter.getAction(i) !in CROSS_APP_BROADCAST_ACTIONS) return false
        }
        return true
    }

    // The native SDK talks to itself with implicit local.client / local.service broadcasts.
    // Non-exported receivers only get broadcasts scoped to this package, so pin them here.
    override fun sendBroadcast(intent: Intent?) {
        super.sendBroadcast(scopeInAppBroadcast(intent))
    }

    private fun scopeInAppBroadcast(intent: Intent?): Intent? {
        if (intent == null || intent.action !in IN_APP_BROADCAST_ACTIONS ||
            intent.`package` != null || intent.component != null
        ) {
            return intent
        }
        return Intent(intent).setPackage(packageName)
    }

    override fun onCreate() {
        super.onCreate()
        
        // Initialize Branch
        RNBranchModule.getAutoInstance(this)

        // Increase cursor window size
        try {
            val field = CursorWindow::class.java.getDeclaredField("sCursorWindowSize")
            field.isAccessible = true
            field.set(null, 10 * 1024 * 1024) // 10MB is the new size
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // Enable debugging WebView from Chrome DevTools
        if (BuildConfig.DEBUG || BuildConfig.IS_RAMP_UAT == "true" || BuildConfig.IS_RAMP_DEV == "true") {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        // Initialize SoLoader
        SoLoader.init(this, OpenSourceMergedSoMapping)
        
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }

        ApplicationLifecycleDispatcher.onApplicationCreate(this)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
    }

    companion object {
        // Broadcasts that legitimately come from other apps and are registered through
        // the two-argument registerReceiver (netinfo's Amazon Fire connectivity poller).
        private val CROSS_APP_BROADCAST_ACTIONS = setOf(
            "com.amazon.tv.networkmonitor.INTERNET_DOWN",
            "com.amazon.tv.networkmonitor.INTERNET_UP",
        )

        // Broadcasts the bundled MetaMask native SDK sends between its own components.
        private val IN_APP_BROADCAST_ACTIONS = setOf("local.client", "local.service")
    }
}

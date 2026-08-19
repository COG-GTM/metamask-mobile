package io.metamask

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.MotionEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactRootView
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import io.branch.rnbranch.RNBranchModule

class MainActivity : ReactActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Set the theme to AppTheme BEFORE onCreate to support
        // coloring the background, status bar, and navigation bar.
        // This is required for expo-splash-screen.
        setTheme(R.style.AppTheme)
        super.onCreate(null)
        enableOverlayProtection()
    }

    /**
     * Tapjacking / UI redressing protection.
     *
     * On Android 12+ the system hides overlay windows drawn by other apps while
     * this activity is in the foreground. On every version, touches delivered
     * while the window is (partially) obscured by another app's window are
     * discarded, so a spoofed overlay cannot get a signing/approval action
     * confirmed on the user's behalf.
     *
     * Disabled in debug builds only, where the React Native dev menu itself is
     * drawn as an overlay window.
     */
    private fun enableOverlayProtection() {
        if (BuildConfig.DEBUG) {
            return
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            window.setHideOverlayWindows(true)
        }
        window.decorView.filterTouchesWhenObscured = true
    }

    override fun dispatchTouchEvent(event: MotionEvent): Boolean {
        if (isObscured(event)) {
            return false
        }
        return super.dispatchTouchEvent(event)
    }

    private fun isObscured(event: MotionEvent): Boolean {
        val obscuredFlags = MotionEvent.FLAG_WINDOW_IS_OBSCURED or
            MotionEvent.FLAG_WINDOW_IS_PARTIALLY_OBSCURED
        return !BuildConfig.DEBUG && (event.flags and obscuredFlags) != 0
    }

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "MetaMask"

    // Branch.io integration
    override fun onStart() {
        super.onStart()
        RNBranchModule.initSession(intent.data, this)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        /*
         * if activity is in foreground (or in backstack but partially visible) launch the same
         * activity will skip onStart, handle this case with reInit
         * if reInit() is called without this flag, you will see the following message:
         * BRANCH_SDK: Warning. Session initialization already happened.
         * To force a new session,
         * set intent extra, "branch_force_new_session", to true.
         */
        if (intent.hasExtra("branch_force_new_session") &&
            intent.getBooleanExtra("branch_force_new_session", false)
        ) {
            RNBranchModule.onNewIntent(intent)
        }
    }

    /**
    * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
    * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
    */
    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            object : DefaultReactActivityDelegate(
                this,
                mainComponentName,
                fabricEnabled
            ){
                override fun getLaunchOptions(): Bundle {
                    return Bundle().apply {
                        putString(
                            "foxCode",
                            BuildConfig.foxCode ?: "debug"
                        )
                    }
                }
            }
        )
    }

    /**
     * Align the back button behavior with Android S
     * where moving root activities to background instead of finishing activities.
     * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
     */
    override fun invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                // For non-root activities, use the default implementation to finish them.
                super.invokeDefaultOnBackPressed()
            }
            return
        }

        // Use the default back button implementation on Android S
        // because it's doing more than [Activity.moveTaskToBack] in fact.
        super.invokeDefaultOnBackPressed()
    }
} 
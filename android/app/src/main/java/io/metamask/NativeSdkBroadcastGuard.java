package io.metamask;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;

import java.util.Iterator;

/**
 * The bundled nativesdk.aar moves decrypted dapp traffic between MessageService and
 * CommunicationClient with implicit "local.client" / "local.service" broadcasts sent and
 * registered through the application context. Left as-is, any installed app can read that
 * traffic (including dapp session ids) and inject forged messages. MainApplication routes
 * those calls through this guard so the broadcasts stay inside this app.
 */
public final class NativeSdkBroadcastGuard {
  public static final String ACTION_CLIENT = "local.client";
  public static final String ACTION_SERVICE = "local.service";
  static final String PERMISSION_SUFFIX = ".permission.NATIVE_SDK_BROADCAST";

  private NativeSdkBroadcastGuard() {}

  public static boolean isNativeSdkAction(String action) {
    return ACTION_CLIENT.equals(action) || ACTION_SERVICE.equals(action);
  }

  public static boolean isNativeSdkIntent(Intent intent) {
    return intent != null && isNativeSdkAction(intent.getAction());
  }

  public static boolean isNativeSdkFilter(IntentFilter filter) {
    if (filter == null) {
      return false;
    }
    Iterator<String> actions = filter.actionsIterator();
    if (actions == null) {
      return false;
    }
    while (actions.hasNext()) {
      if (isNativeSdkAction(actions.next())) {
        return true;
      }
    }
    return false;
  }

  /** Signature-level permission declared in AndroidManifest.xml; only this app holds it. */
  public static String permission(Context context) {
    return context.getPackageName() + PERMISSION_SUFFIX;
  }

  /** Copy of the intent that is only delivered to receivers in this package. */
  public static Intent restrictToPackage(Context context, Intent intent) {
    return new Intent(intent).setPackage(context.getPackageName());
  }

  /**
   * Registers the receiver so only senders holding the signature permission (i.e. this app)
   * can reach it; on API 33+ it is additionally marked RECEIVER_NOT_EXPORTED.
   * {@code base} must not route back into the caller's 2-arg registerReceiver override.
   */
  public static Intent registerPrivateReceiver(
      Context base, BroadcastReceiver receiver, IntentFilter filter) {
    String permission = permission(base);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      return base.registerReceiver(
          receiver, filter, permission, null, Context.RECEIVER_NOT_EXPORTED);
    }
    return base.registerReceiver(receiver, filter, permission, null);
  }
}

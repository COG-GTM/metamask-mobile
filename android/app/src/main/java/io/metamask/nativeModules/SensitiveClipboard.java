package io.metamask.nativeModules;

import android.content.ClipData;
import android.content.ClipDescription;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Build;
import android.os.PersistableBundle;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class SensitiveClipboard extends ReactContextBaseJavaModule {
  private static final String SENSITIVE_CLIPBOARD_ERROR_CODE = "SENSITIVE_CLIPBOARD_ERROR_CODE";
  private static final String EXTRA_IS_SENSITIVE_COMPAT = "android.content.extra.IS_SENSITIVE";

  SensitiveClipboard(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "SensitiveClipboard";
  }

  private ClipboardManager getClipboardService() {
    return (ClipboardManager) getReactApplicationContext().getSystemService(Context.CLIPBOARD_SERVICE);
  }

  @ReactMethod
  public void setSensitiveString(String text, Promise promise) {
    try {
      ClipData clipData = ClipData.newPlainText(null, text);
      PersistableBundle extras = new PersistableBundle();
      String extraKey = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
        ? ClipDescription.EXTRA_IS_SENSITIVE
        : EXTRA_IS_SENSITIVE_COMPAT;
      extras.putBoolean(extraKey, true);
      clipData.getDescription().setExtras(extras);
      getClipboardService().setPrimaryClip(clipData);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(SENSITIVE_CLIPBOARD_ERROR_CODE, "Failed to set sensitive clipboard content.", e);
    }
  }
}

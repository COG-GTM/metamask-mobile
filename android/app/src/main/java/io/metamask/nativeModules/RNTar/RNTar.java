package io.metamask.nativeModules.RNTar;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.util.Log;
import com.facebook.react.bridge.Promise;
import java.io.IOException;

public class RNTar extends ReactContextBaseJavaModule {
  private static String MODULE_NAME = "RNTar";

  public RNTar(ReactApplicationContext context) {
    super(context);
  }

  @NonNull
  @Override
  public String getName() {
    return MODULE_NAME;
  }

  private String extractTgzFile(String tgzPath, String outputPath) throws IOException {
    try {
      return new TarExtractor().extract(tgzPath, outputPath);
    } catch (IOException e) {
      Log.e("DecompressTgzFile", "Error decompressing tgz file", e);
      throw new IOException("Error decompressing tgz file: " + e.getMessage(), e);
    }
  }

  @ReactMethod
  public void unTar(String pathToRead, String pathToWrite, final Promise promise) {
    Log.d(MODULE_NAME, "Create event called with name: " + pathToRead
      + " and location: " + pathToWrite);
    new Thread(() -> {
      try {
        String decompressedPath = extractTgzFile(pathToRead, pathToWrite);
        promise.resolve(decompressedPath);
      } catch(Exception e) {
        promise.reject("Error uncompressing file:", e);
      }
    }).start();
  }
}

package com.opaque;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class OpaqueModule extends ReactContextBaseJavaModule {
  public static final String NAME = "Opaque";
  private static native void initialize(long jsiPtr);

  public OpaqueModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public boolean install() {
    try {
      System.loadLibrary("opaque");

      ReactApplicationContext context = getReactApplicationContext();
      initialize(
        context.getJavaScriptContextHolder().get()
      );
      return true;
    } catch (Exception exception) {
      return false;
    }
  }
}
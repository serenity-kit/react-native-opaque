#include <jni.h>
#include "react-native-opaque.h"

extern "C" JNIEXPORT void JNICALL
Java_com_opaque_OpaqueModule_initialize(JNIEnv *env, jclass clazz, jlong jsiPtr, jstring docPath)
{
    Opaque::installOpaque(*reinterpret_cast<facebook::jsi::Runtime *>(jsiPtr));
}
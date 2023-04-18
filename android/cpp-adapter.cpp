#include <jni.h>
#include "react-native-opaque.h"

extern "C"
JNIEXPORT jint JNICALL
Java_com_opaque_OpaqueModule_nativeMultiply(JNIEnv *env, jclass type, jdouble a, jdouble b) {
    return opaque::multiply(a, b);
}

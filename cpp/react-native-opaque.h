#include <jsi/jsilib.h>
#include <jsi/jsi.h>

#ifndef CPP_REACT_NATIVE_OPAQUE_H_
#define CPP_REACT_NATIVE_OPAQUE_H_

namespace NativeOpaque {
    void installOpaque(facebook::jsi::Runtime& jsiRuntime);
}

#endif  // CPP_REACT_NATIVE_OPAQUE_H_

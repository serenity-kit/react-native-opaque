cmake_minimum_required(VERSION 3.4.1)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 11)

# add directories to "include" search paths
include_directories(
            ../cpp
            "${NODE_MODULES_DIR}/react-native/React"
            "${NODE_MODULES_DIR}/react-native/React/Base"
            "${NODE_MODULES_DIR}/react-native/ReactCommon/jsi"
)

# here we define a library target called "opaque"
# which will be built from the listed source files
add_library(opaque
  SHARED
  "${NODE_MODULES_DIR}/react-native/ReactCommon/jsi/jsi/jsi.cpp"
  ../cpp/react-native-opaque.cpp
  ../cpp/react-native-opaque.h
  ../cpp/opaque-rust.h
  ../cpp/opaque-rust.cpp
  cpp-adapter.cpp
)

# set the rust base target dir
set(RUST_BUILD_DIR ${CMAKE_CURRENT_LIST_DIR}/../rust/target)

# set the rust target dir depending on the target abi
if (${ANDROID_ABI} STREQUAL arm64-v8a)
  set(RUST_TARGET_DIR ${RUST_BUILD_DIR}/aarch64-linux-android)
elseif(${ANDROID_ABI} STREQUAL armeabi-v7a)
  set(RUST_TARGET_DIR ${RUST_BUILD_DIR}/arm-linux-androideabi)
elseif(${ANDROID_ABI} STREQUAL x86)
  set(RUST_TARGET_DIR ${RUST_BUILD_DIR}/i686-linux-android)
else()
  set(RUST_TARGET_DIR ${RUST_BUILD_DIR}/x86_64-linux-android)
endif()

# link the rust lib with our "opaque" library target defined earlier
target_link_libraries(opaque
  ${RUST_TARGET_DIR}/release/libopaque_rust.a
)

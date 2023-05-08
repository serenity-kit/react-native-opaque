cmake_minimum_required(VERSION 3.4.1)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 11)

include_directories(
            ../cpp
            ../node_modules/react-native/React
            ../node_modules/react-native/React/Base
            ../node_modules/react-native/ReactCommon/jsi
)

add_library(opaque
  SHARED
  ../node_modules/react-native/ReactCommon/jsi/jsi/jsi.cpp
  ../cpp/react-native-opaque.cpp
  ../cpp/react-native-opaque.h
  ../cpp/rust.h
  ../cpp/rust.cpp
  cpp-adapter.cpp
)

set(RUST_BUILD_DIR ${CMAKE_CURRENT_LIST_DIR}/../rust/target)

if (${ANDROID_ABI} STREQUAL arm64-v8a)
  set(RUST_TARGET_DIR ${RUST_BUILD_DIR}/aarch64-linux-android)
elseif(${ANDROID_ABI} STREQUAL armeabi-v7a)
  set(RUST_TARGET_DIR ${RUST_BUILD_DIR}/arm-linux-androideabi)
elseif(${ANDROID_ABI} STREQUAL x86)
  set(RUST_TARGET_DIR ${RUST_BUILD_DIR}/i686-linux-android)
else()
  set(RUST_TARGET_DIR ${RUST_BUILD_DIR}/x86_64-linux-android)
endif()

target_link_libraries(opaque
  debug ${RUST_TARGET_DIR}/debug/librust.a
  optimized ${RUST_TARGET_DIR}/release/librust.a
)

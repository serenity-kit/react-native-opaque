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
  cpp-adapter.cpp
)

target_link_libraries(opaque)
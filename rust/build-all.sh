#!/bin/bash

IOS_TARGETS="x86_64-apple-ios"
ANDROID_TARGETS="i686-linux-android x86_64-linux-android aarch64-linux-android arm-linux-androideabi"

for TARGET in $IOS_TARGETS
do
    cargo build --target $TARGET
done

for TARGET in $ANDROID_TARGETS
do
    ./build-android.sh $TARGET
done

cxxbridge src/lib.rs --header > ../cpp/opaque-rust.h
cxxbridge src/lib.rs > ../cpp/opaque-rust.cpp

#!/bin/bash

IOS_TARGETS="x86_64-apple-ios aarch64-apple-ios aarch64-apple-ios-sim"
ANDROID_TARGETS="i686-linux-android x86_64-linux-android aarch64-linux-android arm-linux-androideabi"

for TARGET in $IOS_TARGETS
do
    cargo build --target $TARGET --release
done

for TARGET in $ANDROID_TARGETS
do
    ./build-android.sh $TARGET
done

./gen-cxx.sh

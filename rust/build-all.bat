@echo off

set ANDROID_TARGETS=i686-linux-android x86_64-linux-android aarch64-linux-android arm-linux-androideabi

for %%T in (%ANDROID_TARGETS%) do (
    call build-android.bat %%T
)

cxxbridge src\lib.rs --header > ..\cpp\rust.h
cxxbridge src\lib.rs > ..\cpp\rust.cpp

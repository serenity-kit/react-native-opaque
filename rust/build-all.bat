@echo off

set ANDROID_TARGETS=i686-linux-android x86_64-linux-android aarch64-linux-android arm-linux-androideabi

for %%T in (%ANDROID_TARGETS%) do (
    call build-android.bat %%T
)

call gen-cxx.bat

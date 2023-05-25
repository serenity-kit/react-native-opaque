@echo off
set TARGET=%1

if "%TARGET%" == "" (
    echo missing argument TARGET
    echo Usage: %0 TARGET
    exit /b 1
)

set NDK_TARGET=%TARGET%

if "%TARGET%" == "arm-linux-androideabi" (
    set NDK_TARGET=armv7a-linux-androideabi
)

set API_VERSION=21
set NDK_VERSION=23.1.7779620
set NDK_HOST=windows-x86_64

set NDK=%ANDROID_HOME%\ndk\%NDK_VERSION%
set TOOLS=%NDK%\toolchains\llvm\prebuilt\%NDK_HOST%

set AR=%TOOLS%\bin\llvm-ar
set CXX=%TOOLS%\bin\%NDK_TARGET%%API_VERSION%-clang++
set RANLIB=%TOOLS%\bin\llvm-ranlib
set CXXFLAGS=--target=%NDK_TARGET%

cargo build --target %TARGET% %EXTRA_ARGS%

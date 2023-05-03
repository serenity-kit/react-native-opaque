require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'

rustlib_xcconfig = {
  # add rust lib debug targets
  'LIBRARY_SEARCH_PATHS[sdk=iphoneos*][arch=arm64][config=Debug]' => '${PODS_TARGET_SRCROOT}/rust/target/aarch64-apple-ios/debug',
  'LIBRARY_SEARCH_PATHS[sdk=iphonesimulator*][arch=x86_64][config=Debug]' => '${PODS_TARGET_SRCROOT}/rust/target/x86_64-apple-ios/debug',
  'LIBRARY_SEARCH_PATHS[sdk=iphonesimulator*][arch=arm64][config=Debug]' => '${PODS_TARGET_SRCROOT}/rust/target/aarch64-apple-ios-sim/debug',

  # add rust lib release targets
  'LIBRARY_SEARCH_PATHS[sdk=iphoneos*][arch=arm64][config=Release]' => '${PODS_TARGET_SRCROOT}/rust/target/aarch64-apple-ios/release',
  'LIBRARY_SEARCH_PATHS[sdk=iphonesimulator*][arch=x86_64][config=Release]' => '${PODS_TARGET_SRCROOT}/rust/target/x86_64-apple-ios/release',
  'LIBRARY_SEARCH_PATHS[sdk=iphonesimulator*][arch=arm64][config=Release]' => '${PODS_TARGET_SRCROOT}/rust/target/aarch64-apple-ios-sim/release',

  # link rust lib
  'OTHER_LIBTOOLFLAGS' => '-lrust',
}

Pod::Spec.new do |s|
  s.name         = "react-native-opaque"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "11.0" }
  s.source       = { :git => "https://github.com/serenity-kit/react-native-opaque.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}", "cpp/**/*.{h,cpp}"

  s.dependency "React-Core"

  # Don't install the dependencies when we run `pod install` in the old architecture.
  if ENV['RCT_NEW_ARCH_ENABLED'] == '1' then
    s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1"
    s.pod_target_xcconfig    = {
        "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
        "OTHER_CPLUSPLUSFLAGS" => "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1",
        "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
        **rustlib_xcconfig
    }
    s.dependency "React-Codegen"
    s.dependency "RCT-Folly"
    s.dependency "RCTRequired"
    s.dependency "RCTTypeSafety"
    s.dependency "ReactCommon/turbomodule/core"
  else
    s.pod_target_xcconfig = rustlib_xcconfig
  end

end

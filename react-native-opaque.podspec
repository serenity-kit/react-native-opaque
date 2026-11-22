require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

rustlib_xcconfig = {

  # add rust lib release targets
  'LIBRARY_SEARCH_PATHS[sdk=iphoneos*][arch=arm64]' => '${PODS_TARGET_SRCROOT}/rust/target/aarch64-apple-ios/release',
  'LIBRARY_SEARCH_PATHS[sdk=iphonesimulator*][arch=x86_64]' => '${PODS_TARGET_SRCROOT}/rust/target/x86_64-apple-ios/release',
  'LIBRARY_SEARCH_PATHS[sdk=iphonesimulator*][arch=arm64]' => '${PODS_TARGET_SRCROOT}/rust/target/aarch64-apple-ios-sim/release',

  # link rust lib
  'OTHER_LIBTOOLFLAGS' => '-lopaque_rust',
}

Pod::Spec.new do |s|
  s.name         = "react-native-opaque"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  # React Native's own minimum where it provides one (as its library template does).
  s.platforms    = { :ios => respond_to?(:min_ios_version_supported, true) ? min_ios_version_supported : "15.1" }
  s.source       = { :git => "https://github.com/serenity-kit/react-native-opaque.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}", "cpp/**/*.{h,cpp}"

  # Recent React Native's JSI headers need C++20.
  s.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    **rustlib_xcconfig
  }

  # React Native's current library podspec: install_modules_dependencies adds React Native's own pods, headers
  # and flags for whichever architecture the app uses, keeping the settings above.
  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end
end

#import "Opaque.h"
#import <objc/message.h>
#import <React/RCTUtils.h>
#import <React/RCTLog.h>
#import "react-native-opaque.h"
#if __has_include(<ReactCommon/RCTTurboModuleWithJSIBindings.h>)
#import <ReactCommon/RCTTurboModuleWithJSIBindings.h>
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/RCTTurboModule.h>
#define OPAQUE_JSI_BINDINGS 1
#endif

// Under the New Architecture the bridge a module is handed has no JavaScript runtime, and recent React Native
// versions no longer declare RCTCxxBridge, so install() can't reach the runtime there. Instead the functions are
// installed through the New Architecture's own hook, RCTTurboModuleWithJSIBindings. React Native calls it with the
// runtime only for a TurboModule, so the module declares itself one, with no methods of its own, and the hook runs
// when JavaScript first reads NativeModules.Opaque (src/index.ts). install() stays for the old architecture and
// does nothing once the functions are in.
#ifdef OPAQUE_JSI_BINDINGS
@interface Opaque () <RCTTurboModule, RCTTurboModuleWithJSIBindings>
@end
#endif

static void installOpaqueOnce(facebook::jsi::Runtime &rt, NSString *via) {
  if (rt.global().hasProperty(rt, "opaque_startClientRegistration")) return;
  NativeOpaque::installOpaque(rt);
  if (rt.global().hasProperty(rt, "opaque_startClientRegistration")) {
    RCTLogInfo(@"opaque installed via %@", via);
  } else {
    RCTLogError(@"opaque install via %@ failed: functions missing", via);
  }
}

@implementation Opaque

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

#ifdef OPAQUE_JSI_BINDINGS
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::ObjCTurboModule>(params);
}
- (void)installJSIBindingsWithRuntime:(facebook::jsi::Runtime &)runtime
                          callInvoker:(const std::shared_ptr<facebook::react::CallInvoker> &)callInvoker {
  installOpaqueOnce(runtime, @"JSI bindings");
}
- (void)installJSIBindingsWithRuntime:(facebook::jsi::Runtime &)runtime {
  installOpaqueOnce(runtime, @"JSI bindings");
}
#endif

// The old architecture's path. The bridge's runtime is looked up by selector because RCTCxxBridge is no longer
// declared in recent React Native versions.
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install) {
  id bridge = self.bridge;
  SEL runtimeSel = NSSelectorFromString(@"runtime");
  void *runtimePtr = nil;
  if (bridge && [bridge respondsToSelector:runtimeSel]) {
    runtimePtr = ((void *(*)(id, SEL))objc_msgSend)(bridge, runtimeSel);
  }
  if (runtimePtr) {
    installOpaqueOnce(*(facebook::jsi::Runtime *)runtimePtr, @"install()");
  } else {
    RCTLogInfo(@"opaque install() found no runtime on %@; the JSI bindings hook installs it",
               NSStringFromClass([bridge class]));
  }
  return nil;
}

@end

#import "Opaque.h"
#import <React/RCTBridge+Private.h>
#import <React/RCTUtils.h>
#import <React/RCTLog.h>
#import "react-native-opaque.h"

@implementation Opaque

@synthesize bridge=_bridge;

RCT_EXPORT_MODULE()

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install) {

  RCTLogInfo(@"installing opaque");
  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)self.bridge;
  if (!cxxBridge.runtime) {
    RCTLogInfo(@"opaque install failure: no cxx bridge runtime");
    return nil;
  }

  RCTLogInfo(@"calling installOpaque with cxx bridge runtime");
  Opaque::installOpaque(*(facebook::jsi::Runtime *)cxxBridge.runtime);
  return nil;
}

@end

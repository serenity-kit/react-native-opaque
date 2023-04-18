#import "Opaque.h"
#import <React/RCTBridge+Private.h>
#import <React/RCTUtils.h>
#import "react-native-opaque.h"

@implementation Opaque

@synthesize bridge=_bridge;
@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (void)setBridge:(RCTBridge *)bridge {
  _bridge = bridge;
  _setBridgeOnMainQueue = RCTIsMainQueue();

  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)self.bridge;
  if (!cxxBridge.runtime) {
    return;
  }

  installOpaque(*(facebook::jsi::Runtime *)cxxBridge.runtime);
}

- (void)invalidate {
  cleanUpOpaque();
}

@end
#ifdef __cplusplus
#import "react-native-opaque.h"
#endif

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNOpaqueSpec.h"

@interface Opaque : NSObject <NativeOpaqueSpec>
#else
#import <React/RCTBridgeModule.h>

@interface Opaque : NSObject <RCTBridgeModule>
#endif

@end

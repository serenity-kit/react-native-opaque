#import "react-native-opaque.h"
#import <React/RCTBridgeModule.h>

@interface Opaque : NSObject <RCTBridgeModule>

@property(nonatomic, assign) BOOL setBridgeOnMainQueue;

@end
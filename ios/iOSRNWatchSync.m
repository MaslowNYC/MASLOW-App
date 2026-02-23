//
//  RNWatchSync.m
//  MASLOW
//
//  Created on 2/20/26.
//
//  React Native bridge for Watch sync
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNWatchSync, NSObject)

RCT_EXTERN_METHOD(syncToWatch:(nonnull NSNumber *)credits
                  memberNumber:(nonnull NSNumber *)memberNumber)

RCT_EXTERN_METHOD(clearWatchData)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end

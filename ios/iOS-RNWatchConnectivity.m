//
//  RNWatchConnectivity.m
//  Maslow
//
//  Created on 2/20/26.
//
//  React Native bridge for Watch Connectivity
//  Add this to your iOS app to expose Watch Connectivity to JavaScript
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNWatchConnectivity, NSObject)

RCT_EXTERN_METHOD(sendUserData:(NSString *)memberId
                  name:(NSString *)name
                  membershipTier:(NSString *)membershipTier
                  email:(NSString *)email)

RCT_EXTERN_METHOD(clearUserData)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end

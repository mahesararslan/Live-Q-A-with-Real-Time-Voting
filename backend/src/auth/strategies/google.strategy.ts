import { Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import googleOauthConfig from "../config/google-oauth.config";
import { ConfigType } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) { 
  constructor(
    private authService: AuthService,
    @Inject(googleOauthConfig.KEY)
    private googleConfiguration: ConfigType<typeof googleOauthConfig>
  ) {
    super({
      clientID: googleConfiguration.clientId ?? "",
      clientSecret: googleConfiguration.clientSecret ?? "",
      callbackURL: googleConfiguration.googleCallbackUrl ?? "",
      scope: ["email", "profile"],
    });                                                                                                
  }

  async validate(
    accessToken: string, 
    refreshToken: string, 
    profile: any,
    done: VerifyCallback
  ) {
    console.log({ profile });
    const user = await this.authService.validateGoogleUser({
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        avatarUrl: profile.photos[0].value,
        password: "", 
    });
    console.log("Validated Google user:", user);
    
    // Return the user object that will be attached to req.user
    done(null, user); 
  }
  
}
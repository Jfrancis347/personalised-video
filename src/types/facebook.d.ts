interface FacebookAuthResponse {
  authResponse: {
    accessToken: string;
    expiresIn: string;
    signedRequest: string;
    userID: string;
  };
  status: 'connected' | 'not_authorized' | 'unknown';
}

interface FacebookSDK {
  init(params: {
    appId: string;
    cookie?: boolean;
    xfbml?: boolean;
    version: string;
  }): void;
  login(
    callback: (response: FacebookAuthResponse) => void,
    options?: { scope: string }
  ): void;
}

interface Window {
  FB?: FacebookSDK;
  fbAsyncInit?: () => void;
}
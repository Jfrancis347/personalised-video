import React from 'react';
import { Facebook, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onSuccess: (accessToken: string) => void;
}

export function FacebookAuthButton({ onSuccess }: Props) {
  const [loading, setLoading] = React.useState(false);
  const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;

  React.useEffect(() => {
    // Initialize Facebook SDK
    window.fbAsyncInit = function() {
      if (window.FB) {
        window.FB.init({
          appId: FB_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
      }
    };

    // Load Facebook SDK
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode?.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  const handleLogin = () => {
    setLoading(true);

    if (!window.FB) {
      toast.error('Facebook SDK not loaded. Please try again.');
      setLoading(false);
      return;
    }

    window.FB.login((response) => {
      if (response.authResponse) {
        onSuccess(response.authResponse.accessToken);
      } else {
        toast.error('Facebook login was cancelled or failed');
      }
      setLoading(false);
    }, { scope: 'ads_read,ads_management' });
  };

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#1877F2] hover:bg-[#0C63D4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1877F2] disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Facebook className="h-5 w-5 mr-2" />
          Connect Facebook Ads
        </>
      )}
    </button>
  );
}
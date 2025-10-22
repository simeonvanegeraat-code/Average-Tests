import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ✅ Google AdSense Auto Ads */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9252617114074571"
          crossOrigin="anonymous"
        ></script>

        {/* ✅ Google AdSense meta verification */}
        <meta
          name="google-adsense-account"
          content="ca-pub-9252617114074571"
        />

        {/* ✅ Google Consent Mode (CMP) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-ConsentMode"
        ></script>
        <script
          id="consent-mode"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'analytics_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied'
              });
              gtag('set', 'ads_data_redaction', true);
              gtag('js', new Date());
              gtag('config', 'G-ConsentMode');
            `,
          }}
        />

        {/* ✅ Basis meta SEO */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="robots" content="max-image-preview:large" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>

      <body className="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50">
        <Main />
        <NextScript />

        {/* ✅ CMP Overlay Loader (Google’s consent banner) */}
        <script
          id="google-cmp-loader"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                const s=document.createElement("script");
                s.src="https://fundingchoicesmessages.google.com/i/pub-9252617114074571?ers=1";
                s.async=true;
                document.body.appendChild(s);
              })();
            `,
          }}
        />
      </body>
    </Html>
  );
}

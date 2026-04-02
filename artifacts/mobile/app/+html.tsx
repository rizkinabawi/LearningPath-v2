import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Web HTML template for Expo Router.
 * This file customizes the HTML wrapper shown while the JS bundle loads.
 * It is only rendered on the web platform.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>LearningPath</title>
        <meta name="description" content="Belajar lebih cerdas dengan flashcard dan quiz" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: splashCSS }} />
      </head>
      <body>
        {/* Splash screen — visible before React hydrates */}
        <div id="splash-screen">
          <div className="splash-inner">
            <div className="logo-box">
              <span className="logo-emoji">🎓</span>
            </div>
            <p className="app-name">LearningPath</p>
            <p className="app-tagline">Belajar lebih cerdas setiap hari</p>
            <div className="dots-row">
              <span className="dot dot-1" />
              <span className="dot dot-2" />
              <span className="dot dot-3" />
            </div>
          </div>
          <div className="bar-track">
            <div className="bar-fill" />
          </div>
        </div>

        {children}

        {/* Hide splash once React mounts */}
        <script dangerouslySetInnerHTML={{ __html: splashScript }} />
      </body>
    </html>
  );
}

const splashCSS = `
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{height:100%;background:#F4F7FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;}

  #splash-screen{
    position:fixed;inset:0;
    display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    background:#F4F7FF;
    z-index:9999;
    transition:opacity .4s ease;
  }
  #splash-screen.hide{opacity:0;pointer-events:none;}

  .splash-inner{display:flex;flex-direction:column;align-items:center;}

  .logo-box{
    width:88px;height:88px;border-radius:26px;
    background:linear-gradient(135deg,#4C6FFF,#7C47FF);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 12px 32px rgba(76,111,255,.3);
    margin-bottom:20px;
    animation:pop .5s cubic-bezier(.34,1.56,.64,1) both;
  }
  .logo-emoji{font-size:42px;line-height:1;user-select:none;}

  .app-name{
    font-size:26px;font-weight:800;color:#0F1F3D;
    letter-spacing:-.5px;margin-bottom:6px;
    animation:fadeUp .5s .15s ease both;
  }
  .app-tagline{
    font-size:14px;color:#99AAC3;margin-bottom:40px;
    animation:fadeUp .5s .25s ease both;
  }

  .dots-row{display:flex;gap:10px;animation:fadeUp .5s .35s ease both;}
  .dot{
    display:inline-block;width:10px;height:10px;border-radius:50%;
    animation:bounce 1.2s ease-in-out infinite;
  }
  .dot-1{background:#4C6FFF;}
  .dot-2{background:#38BDF8;animation-delay:.18s;}
  .dot-3{background:#7C3AED;animation-delay:.36s;}

  .bar-track{
    position:absolute;bottom:0;left:0;right:0;
    height:3px;background:#E6ECF8;overflow:hidden;
  }
  .bar-fill{
    height:100%;width:40%;
    background:linear-gradient(90deg,#4C6FFF,#38BDF8,#7C3AED);
    border-radius:0 2px 2px 0;
    animation:slide 1.6s ease-in-out infinite;
  }

  @keyframes pop{from{transform:scale(.7);opacity:0;}to{transform:scale(1);opacity:1;}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
  @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.55;}40%{transform:translateY(-10px);opacity:1;}}
  @keyframes slide{0%{margin-left:-40%;}100%{margin-left:100%;}}
`;

const splashScript = `
  (function(){
    var splash = document.getElementById('splash-screen');
    if(!splash) return;
    var observer = new MutationObserver(function(){
      var root = document.getElementById('root') || document.body.firstElementChild;
      if(root && root.children.length > 1){
        observer.disconnect();
        splash.classList.add('hide');
        setTimeout(function(){ splash.style.display='none'; }, 450);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  })();
`;

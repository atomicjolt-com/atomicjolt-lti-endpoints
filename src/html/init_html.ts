import type { InitSettings } from '@atomicjolt/lti-client/types';


export default function initHtml(settings: InitSettings, hashedScriptName: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <style>
          .hidden { display: none !important; }
        </style>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet">
        <link rel="stylesheet" type="text/css" href="/styles.css" />
        <script type="text/javascript">
          window.INIT_SETTINGS = ${JSON.stringify(settings)};
        </script>
      </head>
      <body>
        <noscript>
          <div class="u-flex">
            <i class="material-icons-outlined aj-icon" aria-hidden="true">warning</i>
            <p class="aj-text">
              You must have javascript enabled to use this application.
            </p>
          </div>
        </noscript>
        <div id="main-content">
        </div>
        <script src="/${hashedScriptName}"></script>
      </body>
    </html>
  `;
}

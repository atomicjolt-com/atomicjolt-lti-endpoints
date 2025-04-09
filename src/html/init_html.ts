import type { InitSettings } from '@atomicjolt/lti-client';
import html from './html';

export default function initHtml(settings: InitSettings, hashedScriptName: string) {
  const head = `
    <script type="text/javascript">
      window.INIT_SETTINGS = ${JSON.stringify(settings)};
    </script>
  `;
  const body = `
    <div id="main-content">
    </div>
    <script src="/${hashedScriptName}"></script>
  `;

  return html(head, body);
}

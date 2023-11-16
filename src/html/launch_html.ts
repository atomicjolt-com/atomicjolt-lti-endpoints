import type { LaunchSettings } from '@atomicjolt/lti-client/types';
import html from './html';

export default function launchHtml(settings: LaunchSettings, hashedScriptName: string) {
  const head = `
    <script type="text/javascript">
      window.LAUNCH_SETTINGS = ${JSON.stringify(settings)};
    </script>
  `;
  const body = `
    <div id="error" class="hidden u-flex aj-centered-message">
      <i class="material-icons-outlined aj-icon" aria-hidden="true">warning</i>
      <p class="aj-text translate">
        There was an error launching the LTI tool. Please reload and try again.
      </p>
    </div>
    <div id="main-content">
    </div>
    <script src="/${hashedScriptName}"></script>
  `;
  return html(head, body);
}

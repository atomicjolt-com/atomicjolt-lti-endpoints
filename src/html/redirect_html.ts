import type { RedirectParams } from '@atomicjolt/lti-server/types';
import html from './html';

export default function redirectHtml(redirectParams: RedirectParams, targetLinkUri: string) {
  const body = `
    <form action="${targetLinkUri}" method="POST">
      <input type="hidden" name="id_token" value="${redirectParams.idToken}" />
      <input type="hidden" name="state" value="${redirectParams.state}" />
      <input type="hidden" name="lti_storage_target" value="${redirectParams.ltiStorageTarget}" />
    </form>
    <script>
      window.addEventListener("load", () => {
        document.forms[0].submit();
      });
    </script>
  `;
  return html("", body);
}

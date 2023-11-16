import html from './html';

export default function dynamicRegistrationFinishHtml() {
  const head = "";
  const body = `
    <h1>Registration complete</h1>
    <script type="text/javascript">
      (window.opener || window.parent).postMessage({subject:"org.imsglobal.lti.close"}, "*");
    </script>
  `;

  return html(head, body);
}

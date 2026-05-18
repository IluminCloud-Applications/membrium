/**
 * HtmlLoginRenderer — renders the user's fully custom HTML login page.
 *
 * Strategy: inject into a full-page <iframe> with a sandboxed srcdoc.
 * A bridge script is injected automatically that:
 *  1. Intercepts form#login-form (or [data-membrium="login"]) submit
 *     → calls /api/auth/login with {email, password}
 *     → on success: posts {type:"LOGIN_SUCCESS", token} to parent
 *  2. Intercepts form#forgot-form (or [data-membrium="forgot"]) submit
 *     → calls /api/auth/forgot-password with {email}
 *     → shows success / error feedback in the form
 */

import { useEffect, useRef } from "react";

interface HtmlLoginRendererProps {
    html: string;
    css: string;
    js: string;
}

/** Script injected into every custom login page iframe */
const BRIDGE_SCRIPT = `
(function () {
  var BASE = window.parent.location.origin;

  function showMsg(form, msg, isError) {
    var el = form.querySelector('[data-membrium-msg]');
    if (!el) {
      el = document.createElement('p');
      el.setAttribute('data-membrium-msg', '1');
      el.style.cssText = 'margin-top:8px;font-size:.85rem;text-align:center;';
      form.appendChild(el);
    }
    el.textContent = msg;
    el.style.color = isError ? '#E62020' : '#22c55e';
  }

  function setBusy(btn, busy) {
    if (!btn) return;
    btn.disabled = busy;
    btn.dataset.origText = btn.dataset.origText || btn.textContent;
    btn.textContent = busy ? 'Aguarde...' : btn.dataset.origText;
  }

  // ─── Login form ───────────────────────────────────────────
  document.addEventListener('submit', function (e) {
    var form = e.target;
    var isLogin  = form.id === 'login-form'  || form.dataset.membrium === 'login';
    var isForgot = form.id === 'forgot-form' || form.dataset.membrium === 'forgot';
    if (!isLogin && !isForgot) return;

    e.preventDefault();
    var btn = form.querySelector('[type=submit]');

    if (isLogin) {
      var email    = (form.querySelector('[name=email]')    || {}).value || '';
      var password = (form.querySelector('[name=password]') || {}).value || '';
      if (!email || !password) { showMsg(form, 'Preencha email e senha.', true); return; }
      setBusy(btn, true);
      fetch(BASE + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email, password: password }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            window.parent.postMessage({ type: 'MEMBRIUM_LOGIN_SUCCESS', data: data }, BASE);
          } else {
            showMsg(form, data.message || 'Email ou senha inválidos.', true);
            setBusy(btn, false);
          }
        })
        .catch(function () { showMsg(form, 'Erro de conexão. Tente novamente.', true); setBusy(btn, false); });
    }

    if (isForgot) {
      var email = (form.querySelector('[name=email]') || {}).value || '';
      if (!email) { showMsg(form, 'Informe o email.', true); return; }
      setBusy(btn, true);
      fetch(BASE + '/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          showMsg(form, data.message || 'Se o e-mail existir, você receberá um link.', !data.success);
          setBusy(btn, false);
        })
        .catch(function () { showMsg(form, 'Erro de conexão. Tente novamente.', true); setBusy(btn, false); });
    }
  });
})();
`;

export function HtmlLoginRenderer({ html, css, js }: HtmlLoginRendererProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Build srcdoc — inject bridge before user JS
    const srcdoc = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    /* Reset básico para evitar margens indesejadas */
    body, html { margin: 0; padding: 0; min-height: 100vh; box-sizing: border-box; }
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>${BRIDGE_SCRIPT}<\/script>
  <script>${js}<\/script>
</body>
</html>`;

    // Listen for login success from iframe
    useEffect(() => {
        function onMessage(e: MessageEvent) {
            if (e.data?.type !== "MEMBRIUM_LOGIN_SUCCESS") return;
            // Redirect same as normal login flow — full page reload picks up the session cookie
            window.location.href = "/member";
        }
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, []);

    return (
        <iframe
            ref={iframeRef}
            srcDoc={srcdoc}
            className="html-login-iframe"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                border: "none",
                margin: 0,
                padding: 0,
                zIndex: 9999,
                backgroundColor: "transparent",
            }}
            title="Login personalizado"
            sandbox="allow-scripts allow-same-origin allow-forms"
        />
    );
}

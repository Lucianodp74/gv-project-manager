"use client";

import { useEffect, useRef, useState } from "react";

const SCOPE = "https://www.googleapis.com/auth/drive.file";

function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) return resolve();
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Impossibile caricare Google Picker."));
    document.head.appendChild(script);
  });
}

export default function ViscontiGoogleDrivePicker({ onPicked }) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const configRef = useRef(null);
  const tokenClientRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cfgResponse = await fetch("/api/visconti-documents/google-config", { cache: "no-store" });
        const cfg = await cfgResponse.json();
        if (!cfg.clientId || !cfg.apiKey || !cfg.appId) {
          throw new Error("Google Drive non ancora configurato: mancano le credenziali Google Cloud.");
        }
        configRef.current = cfg;
        await Promise.all([
          loadScript("https://accounts.google.com/gsi/client", "google-gsi"),
          loadScript("https://apis.google.com/js/api.js", "google-api"),
        ]);
        await new Promise((resolve, reject) => {
          window.gapi.load("picker", { callback: resolve, onerror: reject });
        });
        if (mounted) setReady(true);
      } catch (e) {
        if (mounted) setError(e.message || "Google Drive non disponibile.");
      }
    })();
    return () => { mounted = false; };
  }, []);

  function openPicker() {
    if (!ready || !configRef.current || !window.google?.accounts?.oauth2) return;
    setBusy(true);
    setError("");

    const cfg = configRef.current;
    const showPicker = (accessToken) => {
      const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
        .setIncludeFolders(false)
        .setSelectFolderEnabled(false);

      const picker = new window.google.picker.PickerBuilder()
        .setDeveloperKey(cfg.apiKey)
        .setAppId(cfg.appId)
        .setOAuthToken(accessToken)
        .setOrigin(window.location.origin)
        .addView(docsView)
        .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
        .setTitle("Seleziona un documento da Google Drive")
        .setCallback((data) => {
          if (data.action === window.google.picker.Action.CANCEL) {
            setBusy(false);
            return;
          }
          if (data.action === window.google.picker.Action.PICKED) {
            const doc = data.docs?.[0];
            if (doc) onPicked({
              id: doc.id,
              name: doc.name || "",
              url: doc.url || (doc.id ? `https://drive.google.com/open?id=${doc.id}` : ""),
              mimeType: doc.mimeType || "",
              sizeBytes: doc.sizeBytes ? Number(doc.sizeBytes) : null,
            });
            setBusy(false);
          }
        })
        .build();

      picker.setVisible(true);
    };

    if (!tokenClientRef.current) {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: cfg.clientId,
        scope: SCOPE,
        callback: (response) => {
          if (response?.access_token) showPicker(response.access_token);
          else {
            setBusy(false);
            setError("Google non ha restituito un token di accesso.");
          }
        },
        error_callback: (response) => {
          setBusy(false);
          setError(response?.error_description || "Autorizzazione Google annullata.");
        },
      });
    }

    tokenClientRef.current.requestAccessToken({ prompt: "" });
  }

  return <div>
    <button type="button" className="vd-btn" onClick={openPicker} disabled={!ready || busy}>
      {busy ? "Apertura Drive…" : ready ? "Seleziona da Google Drive" : "Connessione a Drive…"}
    </button>
    {error && <div className="vd-picker-error">{error}</div>}
  </div>;
}

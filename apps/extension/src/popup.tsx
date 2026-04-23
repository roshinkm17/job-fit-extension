import { useEffect, useState } from "react";
import { readEnv } from "./lib/env";
import { getExtensionSupabase } from "./lib/supabase";

export default function Popup(): JSX.Element {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const web = readEnv().webAppUrl;

  useEffect(() => {
    void getExtensionSupabase()
      .auth.getSession()
      .then(({ data }) => {
        setEmail(data.session?.user.email ?? null);
      })
      .catch(() => {
        setEmail(null);
      });
  }, []);

  return (
    <div
      style={{
        width: 280,
        padding: 14,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        color: "#0f172a",
      }}
    >
      {email === undefined ? (
        <p style={{ margin: 0, color: "#64748b" }}>Loading…</p>
      ) : email ? (
        <p style={{ margin: 0 }}>
          Signed in as <strong>{email}</strong>
        </p>
      ) : (
        <p style={{ margin: 0, color: "#64748b" }}>Not signed in to Job Fit.</p>
      )}
      <a
        href={web}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-block",
          marginTop: 10,
          color: "#0a66c2",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Open Job Fit web app
      </a>
    </div>
  );
}

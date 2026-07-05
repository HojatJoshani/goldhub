"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: "#fafafa",
          color: "#1a1a1a",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div style={{ maxWidth: "28rem", width: "100%", textAlign: "center" }}>
            <div
              style={{
                width: "4rem",
                height: "4rem",
                margin: "0 auto 1rem",
                borderRadius: "50%",
                backgroundColor: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
              }}
            >
              ⚠️
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
              خطای برنامه
            </h1>
            <p style={{ color: "#666", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              خطایی در برنامه رخ داد. لطفاً دوباره تلاش کنید.
            </p>
            {error?.message && (
              <details
                style={{
                  fontSize: "0.75rem",
                  color: "#666",
                  backgroundColor: "#f5f5f5",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  marginBottom: "1rem",
                  direction: "ltr",
                  textAlign: "left",
                }}
              >
                <summary style={{ cursor: "pointer" }}>جزئیات خطا</summary>
                <pre style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
                  {error.message}
                </pre>
              </details>
            )}
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1.5rem",
                backgroundColor: "#D4A017",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              تلاش مجدد
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

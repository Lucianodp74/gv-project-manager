import { Suspense } from "react";
import App from "@/components/ProjectManager";

function Loading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0c0f14",
        color: "#7a839a",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        gap: 12,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          border: "2px solid #242a38",
          borderTopColor: "#3b82f6",
          borderRadius: "50%",
          animation: "spin 0.6s linear infinite",
        }}
      />
      Caricamento...
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <App />
    </Suspense>
  );
}

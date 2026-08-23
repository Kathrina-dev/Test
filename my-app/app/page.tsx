"use client";

import dynamic from "next/dynamic";

const App = dynamic(() => import("../src/App").then((mod) => mod.App), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 20, color: "#fff", background: "#03143b", height: "100vh" }}>
      INITIALIZING MAP SCANNER...
    </div>
  ),
});

export default function Home() {
  return <App />;
}

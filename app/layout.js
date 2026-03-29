import "./globals.css";

export const metadata = {
  title: "GV Project Manager – Gruppo Visconti",
  description:
    "Renewable energy project management system for wind, agro-photovoltaic, and storage development.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}

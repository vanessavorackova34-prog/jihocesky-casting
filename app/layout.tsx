import "./globals.css";

export const metadata = {
  title: "LEXAPA CASTING | Herecká databáze",
  description: "Oficiální castingová databáze LEXAPA CASTING pro herce, komparz, modely a talenty z celé České republiky.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}

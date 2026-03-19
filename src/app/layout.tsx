import './globals.css';

export const metadata = {
  title: 'UniFlow',
  description: 'Ecosistema universitario',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

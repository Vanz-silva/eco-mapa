import { Space_Grotesk } from 'next/font/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';

const font = Space_Grotesk({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'EcoMapa DF — Pontos de coleta de pilhas, baterias e óleo vegetal',
  description: 'Encontre pontos de coleta de pilhas, baterias e óleo vegetal usado no Distrito Federal.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-bs-theme="dark">
      <body className={font.className}>{children}</body>
    </html>
  );
}

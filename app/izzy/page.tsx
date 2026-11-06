import type { Metadata } from 'next';
import IzzyClient from './IzzyClient';

export const metadata: Metadata = {
  title: 'Bello Izzy',
  robots: { index: false, follow: false },
};

export default function IzzyPage() {
  return <IzzyClient />;
}

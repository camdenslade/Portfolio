import { Metadata } from 'next';
import CapstoneDeck from '@/components/capstone/CapstoneDeck';

export const metadata: Metadata = {
  title: 'Continuous Key Exchange & The Double Ratchet | Math Capstone',
  description: 'Interactive formal security models, CDH reduction bounds, and state machine simulation.',
};

export default function CapstonePage() {
  return <CapstoneDeck />;
}
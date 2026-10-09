import EastGreenwichFall, { eastGreenwichFallMetadata } from '@/components/EastGreenwichFall';

export const metadata = eastGreenwichFallMetadata('cost');

export default function Page() {
  return <EastGreenwichFall kind="cost" />;
}

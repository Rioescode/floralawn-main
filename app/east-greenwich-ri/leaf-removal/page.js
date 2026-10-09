import EastGreenwichFall, { eastGreenwichFallMetadata } from '@/components/EastGreenwichFall';

export const metadata = eastGreenwichFallMetadata('leaves');

export default function Page() {
  return <EastGreenwichFall kind="leaves" />;
}

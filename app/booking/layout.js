import { getBaseUrl } from '@/utils/seo-helpers';

export const metadata = {
  title: 'Request Service | Flora Lawn and Landscaping Inc',
  description: 'Book your lawn care, landscaping, or snow removal service today.',
  alternates: {
    canonical: `${getBaseUrl()}/booking`
  }
};

export default function BookingLayout({ children }) {
  return children;
}

import ServicePage from "../../ServicePage";

export const metadata = {
  title: 'Professional Lawn Mowing Services in Attleboro, MA | Flora Lawn & Landscaping Inc',
  description: 'Expert lawn mowing services in Attleboro, MA. Regular maintenance, edging, and trimming. Licensed and insured professionals. Free quotes available!',
};

export default function AttleboroLawnMowingPage() {
  return (
    <ServicePage 
      city="Attleboro"
      service="lawn-mowing-service"
      state="MA"
    />
  );
} 
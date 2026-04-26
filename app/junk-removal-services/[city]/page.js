import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { cities } from "@/data/city-details";
import { locations } from "@/data/locations";
import Link from "next/link";
import { 
  TrashIcon, 
  TruckIcon, 
  HomeIcon, 
  BuildingOfficeIcon, 
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ArrowLongRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

export async function generateStaticParams() {
  return locations.map((location) => ({
    city: location.slug,
  }));
}

export async function generateMetadata({ params }) {
  const location = locations.find(l => l.slug === params.city);
  const cityName = location?.city || params.city;
  
  return {
    title: `Reliable Junk Removal & Property Hauling in ${cityName}, RI | Flora Lawn`,
    description: `Same-day junk removal in ${cityName}. We haul furniture, debris, appliances, and more. Eco-friendly disposal and professional property cleanouts in ${cityName}, Rhode Island.`,
    alternates: {
      canonical: `https://riyardworks.com/junk-removal-services/${params.city}`
    }
  };
}

export default function JunkRemovalCityPage({ params }) {
  const location = locations.find(l => l.slug === params.city);
  const cityName = location?.city || "your city";
  const cityInfo = cities.find(c => c.city === cityName);

  const services = [
    {
      name: "Residential Cleanout",
      description: "Full-service removal of furniture, appliances, and household clutter from your {city} home.",
      icon: HomeIcon,
      features: ["Furniture & Bedding", "Basement & Attic Junk", "Garage Cleanouts", "Same-Day Service"]
    },
    {
      name: "Commercial Hauling",
      description: "Fast and professional office and retail cleanout services in the {city} business district.",
      icon: BuildingOfficeIcon,
      features: ["Office Equipment", "Warehouse Clearout", "Retail Debris", "After-Hours Service"]
    },
    {
      name: "Construction Debris",
      description: "Heavy-duty removal of renovation waste and construction materials from your {city} job site.",
      icon: TruckIcon,
      features: ["Wood & Drywall", "Masonry Debris", "Scrap Metal", "Scheduled Pickups"]
    },
    {
      name: "Specialty Items",
      description: "Safe and compliant disposal of difficult items like mattresses, tires, and appliances.",
      icon: TrashIcon,
      features: ["Hot Tub Removal", "Appliance Recycling", "Mattress Pickups", "EPA Compliance"]
    }
  ];

  const valueProps = [
    { title: "Upfront Pricing", text: "No hidden fees. Get a clear estimate before we start hauling.", icon: CurrencyDollarIcon },
    { title: "Eco-Friendly", text: "We prioritize recycling and donations for all {city} pickups.", icon: SparklesIcon },
    { title: "Fast Arrival", text: "In most cases, we can be at your {city} property today.", icon: ClockIcon },
    { title: "Licensed Team", text: "Fully insured professionals you can trust in your home.", icon: ShieldCheckIcon }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      {/* Dynamic Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-100/50 -skew-x-12 translate-x-1/4 z-0" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
             <div>
                <div className="inline-flex items-center bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-bold text-sm mb-8 uppercase tracking-widest shadow-sm">
                   <TruckIcon className="w-5 h-5 mr-2" /> Serving {cityName} Today
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-tight">
                   Clear Your Space in <span className="text-orange-600 italic">{cityName}</span>
                </h1>
                <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
                   Professional junk removal and eco-friendly hauling across {cityName}, RI. We do the heavy lifting so you don't have to.
                </p>
                <div className="flex flex-col sm:flex-row gap-5">
                   <Link href="/contact" className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-5 rounded-2xl font-bold text-lg text-center transition-all shadow-xl shadow-slate-200">
                      Book My Removal
                   </Link>
                   <div className="flex items-center space-x-4 px-4">
                      <div className="flex -space-x-2">
                         {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-5 h-5 text-yellow-400 drop-shadow-sm" />)}
                      </div>
                      <span className="text-slate-900 font-bold">5.0 Star Rated</span>
                   </div>
                </div>
             </div>
             <div className="relative">
                <div className="absolute -inset-4 bg-orange-500/10 blur-3xl rounded-full" />
                <img 
                   src="https://images.unsplash.com/photo-1595131838584-60911739c9f7?q=80&w=2070&auto=format&fit=crop"
                   className="rounded-[3rem] shadow-2xl relative z-10 border-8 border-white"
                   alt={`${cityName} Junk Removal`}
                />
                <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 z-20 max-w-[240px]">
                   <p className="text-slate-900 font-black text-2xl mb-1">$175</p>
                   <p className="text-slate-500 text-sm font-bold">Starting estimate for local {cityName} pickups</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Trust Values Section */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
             {valueProps.map((prop, i) => (
                <div key={i} className="group">
                   <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors">
                      <prop.icon className="w-8 h-8 text-white" />
                   </div>
                   <h3 className="text-xl font-bold mb-3">{prop.title}</h3>
                   <p className="text-slate-400 leading-relaxed font-medium">
                      {prop.text.replace('{city}', cityName)}
                   </p>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
             <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Complete Hauling Solutions</h2>
                <p className="text-xl text-slate-600 font-medium leading-relaxed">
                   From single items to entire estate cleanouts, our specialized crews handle every aspect of the project in {cityName}.
                </p>
             </div>
             <Link href="/contact" className="text-orange-600 font-bold text-lg flex items-center hover:translate-x-2 transition-transform">
                Full Pricing Guide <ArrowLongRightIcon className="w-6 h-6 ml-2" />
             </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
             {services.map((service, i) => (
                <div key={i} className="flex gap-8 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 hover:border-orange-200 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                   <div className="w-16 h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:border-orange-600 transition-colors">
                      <service.icon className="w-8 h-8 text-slate-900 group-hover:text-white transition-colors" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 mb-4">{service.name}</h3>
                      <p className="text-slate-600 mb-8 font-medium italic">"{service.description.replace('{city}', cityName)}"</p>
                      <div className="grid grid-cols-2 gap-y-3">
                         {service.features.map((f, i) => (
                            <div key={i} className="flex items-center text-slate-900 font-bold text-sm">
                               <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-3" />
                               {f}
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* Local Content Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
           <div className="bg-white rounded-[3rem] p-12 md:p-20 shadow-2xl shadow-slate-200 flex flex-col md:flex-row gap-16 items-center">
              <div className="md:w-1/2">
                 <h2 className="text-4xl font-black text-slate-900 mb-8 underline decoration-orange-500 decoration-8 underline-offset-4">Local Disposal in {cityName}</h2>
                 <p className="text-xl text-slate-600 leading-relaxed font-medium mb-10">
                    {cityInfo?.description || `We understand the specific neighborhood layouts and disposal regulations of ${cityName}, ensuring a fast, complication-free removal process.`}
                 </p>
                 <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl">
                    <p className="font-bold text-orange-500 uppercase mb-4 tracking-tighter">Did you know?</p>
                    <p className="text-lg leading-relaxed font-medium">
                       Flora Lawn & Landscaping prioritizes local {cityName} donation centers and recycling facilities to minimize landfill impact by up to 60%.
                    </p>
                 </div>
              </div>
              <div className="md:w-1/2 w-full">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-square bg-slate-100 rounded-3xl flex flex-col items-center justify-center border-4 border-white shadow-lg">
                       <TrashIcon className="w-12 h-12 text-slate-900 mb-4" />
                       <p className="font-black text-slate-900">NO DEBRIS</p>
                    </div>
                    <div className="aspect-square bg-slate-100 rounded-3xl flex flex-col items-center justify-center border-4 border-white shadow-lg scale-110 translate-y-4">
                       <TruckIcon className="w-12 h-12 text-slate-900 mb-4" />
                       <p className="font-black text-slate-900">SAME DAY</p>
                    </div>
                    <div className="aspect-square bg-slate-100 rounded-3xl flex flex-col items-center justify-center border-4 border-white shadow-lg -translate-y-4">
                       <ClipboardDocumentCheckIcon className="w-12 h-12 text-slate-900 mb-4" />
                       <p className="font-black text-slate-900">EASY QUOTE</p>
                    </div>
                    <div className="aspect-square bg-slate-100 rounded-3xl flex flex-col items-center justify-center border-4 border-white shadow-lg">
                       <HomeIcon className="w-12 h-12 text-slate-900 mb-4" />
                       <p className="font-black text-slate-900">HOME SAFE</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-orange-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 50L50 0L100 50L50 100L0 50Z" stroke="white" strokeWidth="0.1" fill="white" />
           </svg>
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center text-white relative z-10">
          <h2 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter">Ready to reclaim your space in {cityName}?</h2>
          <Link href="/contact" className="inline-block bg-white text-orange-600 px-16 py-7 rounded-2xl font-black text-2xl shadow-2xl hover:bg-slate-50 transition-all uppercase tracking-tight">
             Get My Hauling Estimate
          </Link>
          <p className="mt-10 font-bold opacity-80 text-lg uppercase tracking-[0.2em] italic">
             Serving all of ${cityName} and beyond
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
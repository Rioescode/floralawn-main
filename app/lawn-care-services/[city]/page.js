import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { cities } from "@/data/city-details";
import { locations } from "@/data/locations";
import Link from "next/link";
import { 
  CheckBadgeIcon, 
  MapPinIcon, 
  SunIcon, 
  CloudIcon, 
  BeakerIcon, 
  SparklesIcon, 
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export async function generateStaticParams() {
  return locations.map((location) => ({
    city: location.slug,
  }));
}

export async function generateMetadata({ params }) {
  const location = locations.find(l => l.slug === params.city);
  const cityName = location?.city || params.city;
  
  return {
    title: `Expert Lawn Care Maintenance & Health Plans in ${cityName}, RI | Flora Lawn`,
    description: `The #1 rated lawn care team in ${cityName}, Rhode Island. Professional fertilization, weed control, and seasonal maintenance plans built for New England soil. Free quotes!`,
    alternates: {
      canonical: `https://riyardworks.com/lawn-care-services/${params.city}`
    }
  };
}

export default function LawnCareServicesCityPage({ params }) {
  const location = locations.find(l => l.slug === params.city);
  const cityName = location?.city || "your city";
  const cityInfo = cities.find(c => c.city === cityName);

  const programs = [
    {
      name: "Elite Lawn Fertilization",
      icon: BeakerIcon,
      tag: "Most Popular",
      benefits: ["Slow-release nitrogen blends", "Custom soil pH balancing", "Grub and pest prevention", "Premium broadleaf treatment"]
    },
    {
      name: "Full Service Restoration",
      icon: SparklesIcon,
      tag: "Best Value",
      benefits: ["Professional core aeration", "NTEP certified overseeding", "Organic top-dressing", "Compaction relief"]
    },
    {
      name: "Seasonal Maintenance",
      icon: SunIcon,
      tag: "Essential",
      benefits: ["Spring/Fall intensive cleanup", "Weekly/Bi-weekly mowing", "Edge and trim perfection", "Professional mulching"]
    }
  ];

  const faqs = [
    {
      q: `When is the best time for lawn care in ${cityName}?`,
      a: "In Rhode Island, we recommend starting spring cleanup in late March. Fertilization should follow a 6-visit cycle from early spring through late fall for maximum turf health."
    },
    {
      q: "Are the products you use safe for pets and children?",
      a: "Absolutely. We prioritize safety and use professional-grade products that are safe once dry. We also offer organic-based alternatives for eco-conscious homeowners."
    },
    {
      q: "Do I need to be home for the service?",
      a: "No. Our team can complete your service while you're away. We provide instant digital completion notices so you know exactly when your property was serviced."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Premium Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0 opacity-40">
           <img 
            src="https://images.unsplash.com/photo-1592150621744-aca64f48394a?q=80&w=2091&auto=format&fit=crop"
            className="w-full h-full object-cover"
            alt={`${cityName} Lawn`}
           />
           <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-slate-950" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-green-500/20 backdrop-blur-md border border-green-500/30 px-4 py-2 rounded-full mb-8">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => <StarIconSolid key={i} className="w-4 h-4 text-green-400" />)}
              </div>
              <span className="text-green-400 text-sm font-bold uppercase tracking-wider">Top Rated in {cityName}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 leading-[1.1]">
              The Gold Standard of <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Lawn Care</span> in {cityName}
            </h1>
            
            <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl">
              Professional turf management and landscape maintenance engineered specifically for {cityName}'s local climate. Join 500+ satisfied Rhode Island homeowners.
            </p>

            <div className="flex flex-wrap gap-5">
              <Link href="/contact" className="bg-green-600 hover:bg-green-500 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-green-900/40">
                Get a Free Quote
              </Link>
              <div className="flex flex-col justify-center">
                 <span className="text-slate-400 text-sm">Response Time</span>
                 <span className="text-white font-bold">Under 60 Minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-slate-100 py-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-between items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="flex items-center font-bold text-slate-800"><ShieldCheckIcon className="w-6 h-6 mr-2" /> FULLY INSURED</div>
             <div className="flex items-center font-bold text-slate-800"><CheckBadgeIcon className="w-6 h-6 mr-2" /> LOCALLY OWNED</div>
             <div className="flex items-center font-bold text-slate-800"><StarIcon className="w-6 h-6 mr-2" /> 4.9 GOOGLE RATED</div>
             <div className="flex items-center font-bold text-slate-800"><MapPinIcon className="w-6 h-6 mr-2" /> {cityName} RESIDENT FAV</div>
          </div>
        </div>
      </section>

      {/* Core Programs Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Our {cityName} Healthy Lawn Plans</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choose the program that fits your property. We use commercial-grade treatments safe for your family and pets.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {programs.map((program, i) => (
              <div key={i} className="group relative bg-slate-50 border border-slate-200 p-10 rounded-[2.5rem] hover:bg-white hover:border-green-300 hover:shadow-2xl hover:shadow-green-900/10 transition-all duration-500">
                <div className="absolute top-8 right-8 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">{program.tag}</div>
                <program.icon className="w-20 h-20 text-green-600 mb-8 bg-white p-4 rounded-3xl shadow-sm group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-black text-slate-900 mb-6">{program.name}</h3>
                <ul className="space-y-4 mb-10">
                  {program.benefits.map((b, i) => (
                    <li key={i} className="flex items-start text-slate-600 font-medium">
                      <CheckBadgeIcon className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className="inline-flex items-center font-bold text-green-600 group-hover:translate-x-2 transition-transform">
                   Request Details <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Localized Content Section */}
      {cityInfo && (
        <section className="py-24 bg-slate-900 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-green-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-4xl font-extrabold text-white mb-8">Specialized Lawn Care For {cityName} Neighbors</h2>
                <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                  {cityInfo.description || `Properties in ${cityName} require expert timing and specific products to handle Rhode Island's coastal and inland micro-climates.`}
                </p>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-3xl">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <MapPinIcon className="w-6 h-6 text-green-500 mr-3" />
                    How We Handle {cityName} Specific Needs:
                  </h3>
                  <div className="grid gap-4">
                    {cityInfo.lawnChallenges?.map((challenge, i) => (
                      <div key={i} className="flex items-center text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                        <ShieldCheckIcon className="w-5 h-5 text-green-500 mr-4 shrink-0" />
                        <span className="font-semibold">{challenge}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="aspect-square bg-gradient-to-tr from-green-600 to-emerald-500 rounded-3xl rotate-3 scale-95" />
                <div className="absolute inset-0 bg-slate-800 rounded-3xl shadow-2xl p-12 -rotate-3 transition-transform hover:rotate-0 duration-500">
                  <div className="flex items-center mb-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4">
                       <CloudIcon className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Local Timing is Everything</h4>
                      <p className="text-slate-400 text-sm">Synchronized with {cityName} weather</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center text-slate-300 border-b border-slate-700 pb-4">
                      <span>Early Spring Prep</span>
                      <span className="text-green-400 font-bold">March 20th+</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300 border-b border-slate-700 pb-4">
                      <span>Grub Shielding</span>
                      <span className="text-green-400 font-bold">Mid June</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300 border-b border-slate-700 pb-4">
                      <span>Restoration Window</span>
                      <span className="text-green-400 font-bold">Aug - Sept</span>
                    </div>
                  </div>
                  <Link href="/contact" className="mt-10 w-full bg-white text-slate-900 py-4 rounded-xl font-bold flex items-center justify-center hover:bg-slate-100">
                    See Full Yearly Schedule
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SEO FAQ Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center mb-16">
           <h2 className="text-3xl md:text-4xl font-black text-slate-900">Expert Insights for {cityName} Homeowners</h2>
        </div>
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:border-green-200 transition-colors">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center shrink-0 leading-tight">
                <QuestionMarkCircleIcon className="w-6 h-6 text-green-500 mr-4 shrink-0" />
                {faq.q}
              </h3>
              <p className="text-slate-600 leading-relaxed pl-10">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-black mb-10">Ready for the best lawn in {cityName}?</h2>
          <Link href="/contact" className="inline-block bg-white text-green-600 px-16 py-6 rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-slate-100 transition-all scale-100 hover:scale-105">
            GET MY FREE ESTIMATE
          </Link>
          <p className="mt-8 text-white font-bold opacity-80 uppercase tracking-widest text-sm italic underline decoration-white/30 underline-offset-8">
            No long-term contracts required
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ArrowRightIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}
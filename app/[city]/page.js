import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { cities } from "@/data/city-details";
import Link from "next/link";
import { locations } from '@/data/locations';
import { 
  MapPinIcon, 
  PhoneIcon, 
  ClockIcon, 
  CheckIcon, 
  StarIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  HomeIcon,
  ArrowRightIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, CheckCircleIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { lawnServices } from '@/data/lawn-services';
import { getBaseUrl } from '@/utils/seo-helpers';

export async function generateStaticParams() {
  return locations.map((location) => ({
    city: location.slug,
  }));
}

export async function generateMetadata({ params }) {
  const cleanCityParam = params.city.replace(/-ri$|-ma$/, '');
  const cityName = cleanCityParam.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const cityInfo = cities.find(c => c.city.toLowerCase().replace(/\s+/g, '-') === cleanCityParam);
  const baseUrl = getBaseUrl();
  const canonicalUrl = `${baseUrl}/${params.city}`;

  return {
    title: `Premium Lawn Care & Landscaping in ${cityName}, RI | Flora Lawn`,
    description: `The top-rated local choice for lawn maintenance in ${cityName}, Rhode Island. Professional mowing, fertilization, and cleanup services. 2025 Neighborhood Favourite winner!`,
    alternates: { canonical: canonicalUrl }
  };
}

export default function LocationPage({ params }) {
  const { city: slug } = params;
  const location = locations.find((loc) => loc.slug === slug);
  const cleanCityParam = slug.replace(/-ri$|-ma$/, '');
  const cityName = location?.city || "your city";
  const cityInfo = cities.find(c => c.city.toLowerCase().replace(/\s+/g, '-') === cleanCityParam);

  const stats = [
    { label: "RI Ranking", value: "#1 Rated", icon: StarIconSolid },
    { label: "Service Speed", value: "Same-Day", icon: ClockIcon },
    { label: "Local Fav", value: "2025 Winner", icon: CheckBadgeIcon },
    { label: "Elite Team", value: "100% Insured", icon: ShieldCheckIcon }
  ];

  if (!location) return <div>Location not found</div>;

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Premium Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
           <img 
            src="https://images.unsplash.com/photo-1558905612-27141ad1a200?q=80&w=2024&auto=format&fit=crop"
            className="w-full h-full object-cover opacity-25"
            alt={`${cityName} Landscapes`}
           />
           <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/60 to-slate-950" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto">
             {/* Awards Matrix */}
             <div className="flex flex-wrap justify-center gap-6 mb-12">
                <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl group hover:bg-white/10 transition-all">
                  <Image src="/nextdoor-badge.png" alt="Nextdoor Fave" width={40} height={40} className="rounded-full shadow-lg" />
                  <div className="text-left">
                    <p className="text-[10px] text-green-400 font-black uppercase tracking-widest leading-none mb-1">Neighborhood</p>
                    <p className="text-sm text-white font-black italic leading-none">2025 Winner</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl group hover:bg-white/10 transition-all">
                  <Image src="/businessrate-badge.png" alt="BusinessRate Best of 2025" width={40} height={40} className="rounded-full shadow-lg" />
                  <div className="text-left">
                    <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest leading-none mb-1">BusinessRate</p>
                    <p className="text-sm text-white font-black italic leading-none">Best of 2025</p>
                  </div>
                </div>
             </div>

             <h1 className="text-4xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-tight italic">
                Elite Lawn Care in <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent italic">{cityName}</span>
             </h1>
             
             <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                {cityInfo?.description || `Premium grounds maintenance and professional landscaping tailored for ${cityName}'s distinctive properties.`}
             </p>

             <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link href="/contact" className="bg-green-600 hover:bg-green-500 text-white px-12 py-6 rounded-2xl font-black text-2xl transition-all shadow-2xl shadow-green-900/40">
                   Get Instant Quote
                </Link>
                <a href="tel:4013890913" className="flex items-center justify-center bg-white/5 hover:bg-white/10 text-white border border-white/20 px-10 py-6 rounded-2xl font-black text-2xl transition-all">
                   (401) 389-0913
                </a>
             </div>
          </div>
        </div>
      </section>

      {/* Core Stats Bar */}
      <section className="bg-slate-50 border-y border-slate-200 py-12">
         <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
               {stats.map((stat, i) => (
                  <div key={i} className="flex flex-col items-center text-center">
                     <stat.icon className={`w-10 h-10 mb-4 ${i % 2 === 0 ? 'text-green-600' : 'text-yellow-500'}`} />
                     <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                     <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* Local Expertise & Nuance */}
      <section className="py-24 bg-white">
         <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
               <div>
                  <div className="inline-block bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest mb-6 italic">Established Professionals</div>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tight">The Local Choice for {cityName} Homeowners</h2>
                  <p className="text-xl text-slate-600 leading-relaxed mb-10 font-medium border-l-4 border-green-500 pl-8 italic">
                    "Flora Lawn & Landscaping combines over 6 years of New England experience with modern, tech-driven service to deliver a worry-free property maintenance experience in {cityName}."
                  </p>
                  
                  <div className="space-y-6">
                     <div className="flex items-start gap-5 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <HomeIcon className="w-8 h-8 text-green-600 shrink-0" />
                        <div>
                           <h3 className="text-lg font-bold text-slate-900 mb-1 leading-none">Residential Programs</h3>
                           <p className="text-sm text-slate-500 font-medium">Custom plans for family homes and executive estates.</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-5 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <BuildingOfficeIcon className="w-8 h-8 text-green-600 shrink-0" />
                        <div>
                           <h3 className="text-lg font-bold text-slate-900 mb-1 leading-none">Commercial Accounts</h3>
                           <p className="text-sm text-slate-500 font-medium">Uniform, professional maintenance for ${cityName} businesses.</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="relative">
                  <div className="absolute -inset-4 bg-green-600/5 blur-3xl rounded-full" />
                  <div className="bg-slate-900 rounded-[3.5rem] p-12 md:p-16 text-white shadow-2xl relative z-10 border border-white/5">
                     <h3 className="text-2xl font-black mb-10 flex items-center italic">
                        <MapPinIcon className="w-8 h-8 text-green-400 mr-4" />
                        {cityName} Property Watch
                     </h3>
                     <div className="space-y-6">
                        {cityInfo?.lawnChallenges?.map((challenge, i) => (
                           <div key={i} className="flex gap-5 items-center bg-white/5 p-6 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                              <CheckCircleIcon className="w-6 h-6 text-green-500 shrink-0 group-hover:scale-125 transition-transform" />
                              <span className="text-lg font-bold leading-tight">{challenge}</span>
                           </div>
                        )) || [
                          "Inland subsoil moisture retention",
                          "Coastal salt-tolerant turf needs",
                          "Urban pest and weed challenges"
                        ].map((c, i) => (
                           <div key={i} className="flex gap-5 items-center bg-white/5 p-6 rounded-2xl">
                              <CheckCircleIcon className="w-6 h-6 text-green-500" />
                              <span className="text-lg font-bold">{c}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Services Selection Grid */}
      <section className="py-24 bg-slate-50">
         <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-20">
               <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 tracking-tighter">Choose Your Service</h2>
               <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium italic">Comprehensive maintenance programs available for all of {cityName}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {lawnServices.map((svc, i) => (
                  <Link 
                     key={i} 
                     href={`/${slug}/${svc.urlPath}`}
                     className="bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm hover:shadow-2xl hover:border-green-300 transition-all group overflow-hidden"
                  >
                     <div className="h-48 rounded-[2rem] overflow-hidden mb-8 relative">
                        <img src={`/images/${svc.slug}.jpg`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={svc.title} />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                        <div className="absolute bottom-6 left-6 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black text-white uppercase tracking-widest border border-white/10">Active in {cityName}</div>
                     </div>
                     <div className="px-6 pb-6 text-center">
                        <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-green-600 transition-colors uppercase tracking-tight">{svc.title}</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8 italic">"Professional {svc.title.toLowerCase()} for your {cityName} property."</p>
                        <div className="inline-flex items-center text-green-600 font-black text-xs uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                           View Details <ArrowRightIcon className="w-4 h-4 ml-3" />
                        </div>
                     </div>
                  </Link>
               ))}
            </div>
         </div>
      </section>

      {/* FAQ & Quick Answers */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4">
           <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Expert Insights for {cityName}</h2>
           </div>
           <div className="space-y-6">
              {[
                {q: "How do I get a quote for my property?", a: "We provide same-day digital quotes. Contact us via phone or our online form with your address, and we'll analyze your property size immediately."},
                {q: "Do you have local experience in my neighborhood?", a: `Absolutely. Flora Lawn & Landscaping has been serving all corners of ${cityName} for over 6 years with a focus on high-quality, reliable maintenance.`},
                {q: "What if it rains on my service day?", a: "We monitor local weather closely. If conditions are unsafe for your turf, we automatically reschedule to the next clear window and notify you via text."}
              ].map((faq, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 p-8 rounded-3xl hover:border-green-200 hover:bg-white transition-all">
                   <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center leading-tight">
                      <QuestionMarkCircleIcon className="w-6 h-6 text-green-500 mr-4 shrink-0" />
                      {faq.q}
                   </h3>
                   <p className="text-slate-600 font-semibold pl-10 leading-relaxed italic">"{faq.a}"</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Final Premium CTA */}
      <section className="py-24 bg-slate-900 relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-full bg-green-500/5 blur-[120px] rounded-full -translate-y-1/2" />
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-white">
          <h2 className="text-5xl md:text-8xl font-black mb-12 tracking-tighter italic">Ready for the best yard in {cityName}?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/contact" className="bg-green-600 hover:bg-green-500 text-white px-16 py-7 rounded-2xl font-black text-2xl shadow-2xl transition-all scale-100 hover:scale-105">
               Request Free Quote
            </Link>
          </div>
          <p className="mt-12 font-bold opacity-60 uppercase tracking-[0.4em] text-xs italic">
            Proudly serving {cityName} & All surrounding RI areas
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
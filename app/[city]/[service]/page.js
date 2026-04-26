import { cities } from '@/data/city-details';
import { lawnServices } from '@/data/lawn-services';
import { locations } from '@/data/locations';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { generateServiceSchema, generateBreadcrumbSchema, getBaseUrl } from '@/utils/seo-helpers';
import { 
  MapPinIcon, 
  CheckBadgeIcon, 
  StarIcon, 
  ClockIcon, 
  ShieldCheckIcon, 
  UserGroupIcon, 
  ArrowRightIcon, 
  CalendarIcon, 
  SparklesIcon, 
  CurrencyDollarIcon, 
  BoltIcon, 
  PhoneIcon, 
  ChatBubbleLeftIcon, 
  PhotoIcon, 
  DocumentTextIcon, 
  ExclamationCircleIcon,
  CheckIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, StarIcon as StarIconSolid, CheckBadgeIcon as CheckBadgeIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export async function generateStaticParams() {
  const paths = [];
  locations.forEach(location => {
    lawnServices.forEach(service => {
      paths.push({
        city: location.slug,
        service: service.urlPath
      });
    });
  });
  return paths;
}

export async function generateMetadata({ params }) {
  const cleanCityParam = params.city.replace(/-ri$|-ma$/, '');
  const city = cities.find(c => c.city.toLowerCase().replace(/\s+/g, '-') === cleanCityParam);
  const service = lawnServices.find(s => s.urlPath === params.service);

  if (!city || !service) return { title: 'Service Not Found' };

  const cityName = city.city;
  const title = `${service.title} in ${cityName}, RI | Expert ${service.title} by Flora Lawn`;
  const description = service.metaDescription.replace('{city}', cityName);
  const baseUrl = getBaseUrl();
  const canonicalUrl = `${baseUrl}/${params.city}/${params.service}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [{ url: `${baseUrl}/images/${service.slug}.jpg` }],
    }
  };
}

export default async function ServicePage({ params }) {
  const location = locations.find(l => l.slug === params.city);
  const cleanCityParam = params.city.replace(/-ri$|-ma$/, '');
  const city = cities.find(c => c.city.toLowerCase().replace(/\s+/g, '-') === cleanCityParam);
  const service = lawnServices.find(s => s.urlPath === params.service);

  if (!city || !service) notFound();

  const cityName = city.city;
  const h1 = service.h1Variations[Math.floor(Math.random() * service.h1Variations.length)].replace('{city}', cityName);

  const baseUrl = getBaseUrl();
  const serviceSchema = generateServiceSchema(service, cityName);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: cityName, url: `${baseUrl}/${params.city}` },
    { name: service.title, url: `${baseUrl}/${params.city}/${params.service}` }
  ]);

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      
      <Navigation />
      
      {/* Dynamic Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
           <img 
            src={`https://images.unsplash.com/photo-1592150621744-aca64f48394a?q=80&w=2091&auto=format&fit=crop`}
            className="w-full h-full object-cover opacity-30"
            alt={`${service.title} in ${cityName}`}
           />
           <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/60 to-slate-950" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            {/* Awards Display */}
            <div className="flex flex-wrap gap-4 mb-10">
               <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-2xl group hover:bg-white/10 transition-all">
                  <Image src="/nextdoor-badge.png" alt="Nextdoor Fave" width={32} height={32} className="rounded-full" />
                  <div className="text-left">
                    <p className="text-[10px] text-green-400 font-black uppercase tracking-widest leading-none mb-1">Nextdoor</p>
                    <p className="text-xs text-white font-bold leading-none italic">2025 Fave winner</p>
                  </div>
               </div>
               <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-2xl group hover:bg-white/10 transition-all">
                  <Image src="/businessrate-badge.png" alt="BusinessRate Best of 2025" width={32} height={32} className="rounded-full" />
                  <div className="text-left">
                    <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest leading-none mb-1">BusinessRate</p>
                    <p className="text-xs text-white font-bold leading-none italic">Best of 2025</p>
                  </div>
               </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-[1.1] tracking-tight">
               {h1}
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl leading-relaxed">
               Expert {service.title.toLowerCase()} specifically engineered for the unique soil and climate conditions of {cityName}, Rhode Island.
            </p>

            <div className="flex flex-wrap gap-6">
               <Link href="/contact" className="bg-green-600 hover:bg-green-500 text-white px-12 py-5 rounded-2xl font-black text-xl transition-all shadow-2xl shadow-green-900/40 scale-100 hover:scale-105">
                 Book Next-Day Quote
               </Link>
               <a href="tel:4013890913" className="flex items-center text-white px-8 py-5 border border-white/20 rounded-2xl font-bold hover:bg-white/5 transition-all group">
                 <PhoneIcon className="w-6 h-6 mr-3 text-green-400 group-hover:scale-125 transition-transform" />
                 (401) 389-0913
               </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-slate-50 py-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
           <div className="flex flex-wrap justify-between items-center gap-6 text-slate-500 font-black text-xs uppercase tracking-[0.2em] italic">
              <div className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" /> SAME-DAY AVAILABILITY</div>
              <div className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" /> FULLY INSURED</div>
              <div className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" /> 4.9 GOOGLE RATING</div>
              <div className="flex items-center"><CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" /> {cityName} LOCAL FAV</div>
           </div>
        </div>
      </section>

      {/* Local Insights & Context */}
      <section className="py-24 bg-white relative">
         <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
               <div>
                  <div className="inline-block bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest mb-6">Local Expertise</div>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight">Expert {service.title} in {cityName}</h2>
                  <p className="text-xl text-slate-600 leading-relaxed mb-10 font-medium italic">
                    {city.description || `Helping homeowners in ${cityName} achieve the perfect outdoor space through professional ${service.title.toLowerCase()}.`}
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                     <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:border-green-200 transition-colors">
                        <MapPinIcon className="w-10 h-10 text-green-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Service Area</h3>
                        <p className="text-sm text-slate-500 font-medium">Full coverage across all {cityName} neighborhoods.</p>
                     </div>
                     <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:border-green-200 transition-colors">
                        <SparklesIcon className="w-10 h-10 text-green-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Premium Results</h3>
                        <p className="text-sm text-slate-500 font-medium">NTEP Certified products and commercial-grade machines.</p>
                     </div>
                  </div>
               </div>
               
               <div className="relative">
                  <div className="absolute -inset-4 bg-green-500/5 blur-3xl rounded-full" />
                  <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-white shadow-2xl shadow-green-900/20 relative z-10 border border-white/5">
                     <h3 className="text-2xl font-black mb-8 flex items-center">
                        <ExclamationCircleIcon className="w-8 h-8 text-green-400 mr-4" />
                        {cityName} Challenges
                     </h3>
                     <div className="space-y-6">
                        {city.lawnChallenges?.map((challenge, i) => (
                           <div key={i} className="flex gap-5 items-start bg-white/5 p-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 group-hover:bg-green-500 group-hover:text-white group-hover:scale-110 transition-all font-black text-green-400">{i+1}</div>
                              <div>
                                 <p className="text-lg font-bold leading-tight">{challenge}</p>
                                 <p className="text-sm text-slate-400 mt-1 font-medium italic">Handled by Flora Lawn's specialized {cityName} protocol.</p>
                              </div>
                           </div>
                        )) || [
                          "Coastal salt air and variable soil pH",
                          "Local pest and fungus prevalent in RI",
                          "Specific moisture retention issues for {city}"
                        ].map((c, i) => (
                          <div key={i} className="flex gap-4 items-center bg-white/5 p-4 rounded-xl">
                            <CheckBadgeIconSolid className="w-5 h-5 text-green-500 shrink-0" />
                            <span>{c.replace('{city}', cityName)}</span>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Service Details Section */}
      <section className="py-24 bg-slate-50">
         <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-20">
               <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">Our Professional Process</h2>
               <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">How we deliver the best {service.title.toLowerCase()} results in Rhode Island.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
               {service.includes.map((incl, i) => (
                  <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-green-200 transition-all group">
                     <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 group-hover:bg-green-600 transition-colors">
                        <CheckIcon className="w-8 h-8 text-green-600 group-hover:text-white transition-colors" />
                     </div>
                     <h3 className="text-xl font-black text-slate-900 mb-4">{incl}</h3>
                     <p className="text-sm text-slate-500 font-medium italic leading-relaxed">Included as standard in every {service.title} project across {cityName}.</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* Specialty Content (e.g. Mulch Colors) */}
      {service.urlPath === 'mulch-installation' && (
        <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="md:w-1/2">
                <h2 className="text-4xl md:text-5xl font-black mb-8 italic">Premium Double-Shredded Mulch Varieties</h2>
                <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-xl">
                   We offer {cityName} homeowners the highest grade local mulch, rich in nutrients and long-lasting color.
                </p>
                <div className="grid grid-cols-2 gap-6">
                   <div className="flex items-center space-x-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                      <div className="w-12 h-12 bg-[#3D2B1F] rounded-2xl shadow-lg shadow-black/50" />
                      <span className="font-bold text-lg">Dark Brown</span>
                   </div>
                   <div className="flex items-center space-x-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                      <div className="w-12 h-12 bg-[#1A1A1A] rounded-2xl shadow-lg shadow-black/50" />
                      <span className="font-bold text-lg">Midnight Black</span>
                   </div>
                   <div className="flex items-center space-x-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                      <div className="w-12 h-12 bg-[#8B0000] rounded-2xl shadow-lg shadow-black/50" />
                      <span className="font-bold text-lg">Premium Red</span>
                   </div>
                   <div className="flex items-center space-x-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                      <div className="w-12 h-12 bg-[#C2B280] rounded-2xl shadow-lg shadow-black/50" />
                      <span className="font-bold text-lg">Natural Cedar</span>
                   </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="relative rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl grayscale group hover:grayscale-0 transition-all duration-1000">
                  <Image src="/images/mulch-installation.jpg" alt="Mulch in RI" width={800} height={600} className="object-cover h-full" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 p-12 translate-y-2 group-hover:translate-y-0 transition-transform">
                     <p className="text-2xl font-black italic">The perfect finish for {cityName} gardens.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Guide (SEO) */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center mb-20">
           <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight italic">Expert Insights: {service.title} in {cityName}</h2>
        </div>
        <div className="max-w-3xl mx-auto px-4 space-y-8">
           {[
             {q: `How much does ${service.title.toLowerCase()} cost in ${cityName}?`, a: `Costs vary based on property size and condition. For a typical ${cityName} property, we provide custom quotes within 24 hours to ensure you get the best value.`},
             {q: `When is the best time for ${service.title.toLowerCase()} in RI?`, a: `Rhode Island's climate requires specific timing. Generally, late March through October is ideal for ${service.title.toLowerCase()}, but we adjust our techniques monthly based on local weather patterns.`},
             {q: `Is Flora Lawn available in my part of ${cityName}?`, a: `Yes, we serve the entire ${cityName} area, including all local neighborhoods and surrounding Rhode Island towns.`}
           ].map((faq, i) => (
             <div key={i} className="bg-slate-50 border border-slate-100 p-10 rounded-[2rem] hover:border-green-300 hover:bg-white transition-all shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-5 flex items-start">
                   <QuestionMarkCircleIcon className="w-6 h-6 text-green-500 mr-4 shrink-0 mt-1" />
                   {faq.q}
                </h3>
                <p className="text-slate-600 leading-relaxed font-semibold pl-10 italic">"{faq.a}"</p>
             </div>
           ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-green-600 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white/10 skew-x-12 translate-x-1/4 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center text-white relative z-10">
          <h2 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter">Transform your {cityName} yard today.</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/contact" className="bg-white text-green-600 px-16 py-7 rounded-2xl font-black text-2xl shadow-2xl hover:bg-slate-50 transition-all uppercase tracking-tight">
               Get Instant Quote
            </Link>
            <a href="tel:4013890913" className="flex items-center justify-center border-2 border-white/30 text-white px-10 py-7 rounded-2xl font-black text-2xl hover:bg-white/5 transition-all">
              Call Team
            </a>
          </div>
          <p className="mt-12 font-bold opacity-80 uppercase tracking-[0.3em] text-sm underline underline-offset-8 decoration-white/20">
            No contracts required • 5-Star Rated in {cityName}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
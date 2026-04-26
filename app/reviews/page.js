'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const REVIEWS = [
  // GOOGLE REVIEWS
  { name: 'Josefina Schuster', date: '1 Year Ago', source: 'Google Reviews', brand: 'google', text: "Best work ever, in trabajo espectacular muy responsable y limpios..I love it", details: "Lawn Care & Maintenance" },
  { name: 'BELLA Goes', date: '4 Months Ago', source: 'Google Reviews', brand: 'google', text: "Los contraté primero para la limpieza de primavera y ahora para la de otoño. En ambas ocasiones fueron muy profesionales; el trabajo se realizó de forma experta y minuciosa. Volveré a contactarlos en primavera.", details: "Spring & Fall Cleanup" },
  { name: 'T', date: '8 Months Ago', source: 'Google Reviews', brand: 'google', text: "No tengo palabras para describir el increíble trabajo realizado. Desde la primera consulta hasta los últimos retoques en nuestro jardín, su equipo demostró una profesionalidad excepcional, eficiencia y un genuino cuidado por su trabajo.", details: "Landscaping & Lawn Care" },
  { name: 'Tim J', date: '10 Months Ago', source: 'Google Reviews', brand: 'google', text: "Llamé a Rafael y a su equipo para la instalación de mantillo. ¡Respuesta rápida, precio justo y un servicio excepcional! Lo recomiendo ampliamente.", details: "Mulch Installation" },
  { name: 'Soror Natasha Gordon', date: '1 Year Ago', source: 'Google Reviews', brand: 'google', text: "¡Estamos muy satisfechos con Flora Lawn & Landscaping! Han estado ayudando a mantener nuestro jardín durante dos años y continuaremos usándolos. ¡Ellos cortan el césped, mantienen los lechos de plantas y limpian el otoño y la primavera!", details: "Full Service Lawn Care" },
  { name: 'Mathew Huxel', date: '1 Year Ago', source: 'Google Reviews', brand: 'google', text: "Flora hace un trabajo rápido y profesional a un precio muy asequible. Mi césped luce impecable durante toda la temporada sin ninguna preocupación por mi parte. Los recomiendo muchísimo.", details: "Lawn Mowing and Trimming" },
  { name: 'S P', date: '2 Years Ago', source: 'Google Reviews', brand: 'google', text: "Maravilloso, puntual, atención al detalle y excelente comunicación. Tenemos muchísima suerte de que Flora Lawn embellezca nuestro jardín cada semana.", details: "Weekly Lawn Maintenance" },
  { name: 'melissa debarros', date: '11 Months Ago', source: 'Google Reviews', brand: 'google', text: "Fue un placer trabajar con ellos. La comunicación fue clara, cordial y su trabajo fue excelente. ¡Estamos felices de finalmente tener un patio limpio! 🙌🏽", details: "Yard Cleanup" },
  { name: 'Mary Mcnichols', date: '11 Months Ago', source: 'Google Reviews', brand: 'google', text: "Recomendamos ampliamente los servicios de Floras Lawn & Landscaping. Hicieron un trabajo excelente en nuestro jardín y los recomendamos sin dudarlo. Gracias.", details: "Landscaping" },

  // THUMBTACK REVIEWS
  { name: 'John B.', date: 'Jun 8, 2024', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "This guy is a true honest professional. He showed up when he said he would and my yard looks great. I will definitely use this company again.", details: "Full Service Lawn Care" },
  { name: 'Megan M.', date: 'Aug 23, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "After looking at several companies to help us with our yard clean up and weeding, we finally decided to go with Flora Lawn & Landscaping, and we are SO GLAD we did!!! Don't just take my word for it, look at the before and after pics attached! We even asked them to come back monthly because they did such an amazing job. Absolutely went above and beyond and for a fair price. So happy we found them!", details: "Full Service Lawn Care" },
  { name: 'Sandra G.', date: 'Aug 12, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "He did an Awesome job on our yard. Despite all the rain it was still done in a timely manner. Highly recommended. I will definitely use him again in the fall. Considerate & professional", details: "Lawn Mowing and Trimming" },
  { name: 'Cesar R.', date: 'Aug 2, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "He did an amazing job with our yard! Very professional, and I love the nice crisp lines on my lawn! The price was reasonable and I've hired him to come back every 2 weeks to maintain my lawn. I am very happy with these service and so will you. Highly recommended.", details: "Lawn Mowing and Trimming" },
  { name: 'Karen M.', date: 'Jun 21, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "Can't believe that I finally found a landscaper that I love. He does such a great job and listens to what you want done. His price is fair his work is beautiful and he was right on time. I was having a party and they came and completed the work for me", details: "Full Service Lawn Care" },
  { name: 'Shawna C.', date: 'Aug 13, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "This company did an excellent job. My lawn had been very overgrown with a lot of weeds. Flora Lawn & Landscaping came in and assessed what needed to be done and worked quickly, thoroughly, and professionally to get the job done. Pricing was reasonable as well. I’m now working with them for regular lawn upkeep and couldn’t be happier.", details: "Full Service Lawn Care" },
  { name: 'Keely C.', date: 'Aug 1, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "He did a fabulous job cleaning up my entire yard, redoing all of my edges, weeding, mulching. He is doing my biweekly maintenance. Definitely would and have recommended.", details: "Full Service Lawn Care" },
  { name: 'Dennis F.', date: 'Jul 23, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "The service was supposed to start on Monday and on Sunday morning he was already there. The lawn was very nicely done! So far I'd highly recommend!!", details: "Full Service Lawn Care" },
  { name: 'Andy D.', date: 'Jul 30, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "Cannot say enough here, we’re putting our house up on the market and I needed someone to do all the things in the yard that I’ve neglected to do over the last two years. Very happy to have chosen Flora Landscaping. Work was excellent, he was extremely communicative, incredibly well priced, and did an exceptional job with all of our leaves, hedges, and trimming. Don’t hesitate to hire!", details: "Full Service Lawn Care" },
  { name: 'Christi K.', date: 'Jun 13, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "If I could also select punctuality as a point this company excels at I would. The owner and his crew are responsible, fair, hard working and fast. The work we needed done was completed in a timely manner and was exactly what we wanted. He and his crew went above and beyond, and are worth every penny. A wonderful local family business we feel so lucky to have started working with!! 5 stars all the way!!!", details: "Full Service Lawn Care" },
  { name: 'Ratan S.', date: 'Aug 6, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "Our lawn and flower beds were incredibly done. We are really impressed by the work quality. We will highly recommend Raphael and his crew.", details: "Lawn Mowing and Trimming" },
  { name: 'Chris P.', date: 'Sep 4, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "Gave me a good price and was able to complete the work same day and my grass wasn’t cut for months so it was really high 2+ acres. Definitely recommend.", details: "Lawn Mowing and Trimming" },
  { name: 'April W.', date: 'Jul 17, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "I wish I could select more top qualities! They were so quick to respond and very professional And understanding. My yard was no small task and I’m sure it was HOT. But they did a beautiful job and we’re upfront with what they expected it to cost. They were very punctual and always kept me in the loop. I will definitely hire again if I have need and recommend them to everyone!", details: "Full Service Lawn Care" },
  { name: 'Charlene H.', date: 'Aug 11, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "I am very satisfied with the awesome job this young man did on my lawn. I recommend this lawn service to anyone looking for great lawn care.", details: "Full Service Lawn Care" },
  { name: 'Olawale E.', date: 'Apr 27, 2024', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "Flora lawn & landscaping guys did an excellent job. The price was very reasonable and they extremely efficient and effective. I would recommend them", details: "Full Service Lawn Care" },
  { name: 'Craig S.', date: 'Jun 22, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "Flora landscaping came out to my elderly father in laws house and provided a great service for an affordable price. I highly recommend them and will use them again in the future.", details: "Lawn Mowing and Trimming" },
  { name: 'Bo Z.', date: 'Aug 24, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "Come to finish the work as we discussed, didn’t ghost us or drop in the middle. And being responsive in the process, reccomened", details: "Lawn Mowing and Trimming" },
  { name: 'Cathy M.', date: 'Jul 26, 2023', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "Rafael did a great job, showed up on time and my lawn looks great. I plan on hiring him on a regular basis. Thank you!", details: "Lawn Mowing and Trimming" },
  { name: 'Shalom John', date: '8 Months Ago', source: 'Google Reviews', brand: 'google', text: "Dice que viene, pero nunca aparece ni responde a los mensajes ni a las llamadas. Definitivamente, un mal servicio.", details: "Lawn Care" },
  { name: 'Jose C.', date: 'Jun 14, 2024', source: 'Hired on Thumbtack', brand: 'thumbtack', text: "Does a great job when he shows up. He told me he would cut my lawn bi-weekly. Didn't make it the third time, He said his lawnmower was in the shop, because it broke and he never came by again... Get a real business, his cost isn't even competitive.", details: "Lawn Mowing and Trimming" }
];

// Fisher-Yates shuffle to mix Google and Thumbtack randomly but keep bad reviews at the end
const shuffleArray = (array) => {
  const good = array.filter(r => r.name !== 'Jose C.' && r.name !== 'Shalom John');
  const bad = array.filter(r => r.name === 'Jose C.' || r.name === 'Shalom John');
  
  for (let i = good.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [good[i], good[j]] = [good[j], good[i]];
  }
  return [...good, ...bad]; // Keep bad reviews at very bottom for authenticity
};

const MIXED_REVIEWS = shuffleArray(REVIEWS);

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 border-t-[30px] border-green-600">
      <Navigation />

      <main className="pt-40 pb-24 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black text-slate-950 uppercase tracking-tighter italic mb-6">Real Customer <span className="text-green-600">Reviews</span></h1>
          <p className="text-xl text-slate-500 font-semibold max-w-2xl mx-auto">See what your Rhode Island neighbors are saying about Flora Lawn & Landscaping.</p>
        </div>

        {/* DUAL PLATFORM OVERVIEW WIDGET */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* GOOGLE WIDGET */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 flex flex-col md:flex-row gap-8 items-center">
              <div className="text-center md:text-left">
                 <h2 className="text-6xl font-black text-slate-950 mb-2">4.9</h2>
                 <div className="flex justify-center md:justify-start gap-1 text-yellow-400 mb-2">
                    {[...Array(5)].map((_, i) => <StarIconSolid key={i} className="w-6 h-6" />)}
                 </div>
                 <p className="text-xs font-black uppercase tracking-widest text-[#4285F4]">31 Google Reviews</p>
              </div>
              <div className="flex-1 w-full space-y-3 pl-0 md:pl-8 border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0">
                 {[
                    { stars: '5', perc: '94%', color: 'bg-yellow-400' },
                    { stars: '4', perc: '3%', color: 'bg-yellow-300' },
                    { stars: '3', perc: '0%', color: 'bg-yellow-200' },
                    { stars: '2', perc: '0%', color: 'bg-orange-300' },
                    { stars: '1', perc: '3%', color: 'bg-red-400' },
                 ].map((bar, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <span className="w-4 font-black text-slate-400 text-xs">{bar.stars}</span>
                       <StarIconSolid className="w-3 h-3 text-slate-300 shrink-0" />
                       <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${bar.color} rounded-full`} style={{ width: bar.perc === '0%' ? '0%' : bar.perc }} />
                       </div>
                       <span className="w-8 text-right font-bold text-slate-400 text-xs">{bar.perc}</span>
                    </div>
                 ))}
                 <div className="flex flex-wrap gap-2 mt-4">
                     {['precio (5)', 'comunicación (4)', 'patio (3)', 'primavera (2)'].map((tag, i) => (
                        <span key={i} className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-100">{tag}</span>
                     ))}
                 </div>
              </div>
          </div>

          {/* THUMBTACK WIDGET */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 flex flex-col md:flex-row gap-8 items-center">
              <div className="text-center md:text-left">
                 <h2 className="text-6xl font-black text-slate-950 mb-2">4.8</h2>
                 <div className="flex justify-center md:justify-start gap-1 text-green-500 mb-2">
                    {[...Array(5)].map((_, i) => <StarIconSolid key={i} className="w-6 h-6" />)}
                 </div>
                 <p className="text-xs font-black uppercase tracking-widest text-[#009FD9]">71 Thumbtack Reviews</p>
              </div>
              <div className="flex-1 w-full space-y-3 pl-0 md:pl-8 border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0">
                 {[
                    { stars: '5', perc: '96%', color: 'bg-green-500' },
                    { stars: '4', perc: '0%', color: 'bg-green-400' },
                    { stars: '3', perc: '0%', color: 'bg-yellow-400' },
                    { stars: '2', perc: '1%', color: 'bg-orange-400' },
                    { stars: '1', perc: '3%', color: 'bg-red-400' },
                 ].map((bar, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <span className="w-4 font-black text-slate-400 text-xs">{bar.stars}</span>
                       <StarIconSolid className="w-3 h-3 text-slate-300 shrink-0" />
                       <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${bar.color} rounded-full`} style={{ width: bar.perc === '0%' ? '0%' : bar.perc }} />
                       </div>
                       <span className="w-8 text-right font-bold text-slate-400 text-xs">{bar.perc}</span>
                    </div>
                 ))}
                 <div className="flex flex-wrap gap-2 mt-4">
                     {['lawn (17)', 'yard (9)', 'landscaping (6)', 'weed (4)'].map((tag, i) => (
                        <span key={i} className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-100">{tag}</span>
                     ))}
                 </div>
              </div>
          </div>
        </div>

        {/* REVIEWS GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
           {MIXED_REVIEWS.map((review, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
                 {/* Top Accent Line */}
                 <div className={`absolute top-0 left-0 right-0 h-1 ${review.brand === 'google' ? 'bg-[#4285F4]' : 'bg-[#009FD9]'}`} />
                 
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                       <div className={`w-12 h-12 rounded-full text-white flex items-center justify-center font-black text-xl ${review.brand === 'google' ? 'bg-[#4285F4]' : 'bg-slate-900'}`}>
                          {review.name.charAt(0)}
                       </div>
                       <div>
                          <p className="font-black text-slate-900 leading-none">{review.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">{review.date}</p>
                       </div>
                    </div>
                 </div>
                 
                 <div className={`flex gap-1 mb-4 ${review.brand === 'google' ? 'text-yellow-400' : 'text-green-500'}`}>
                    {[...Array((review.name === 'Jose C.' || review.name === 'Shalom John') ? 1 : 5)].map((_, i) => <StarIconSolid key={i} className="w-4 h-4" />)}
                 </div>

                 <p className="text-slate-600 font-semibold mb-8 flex-1 italic relative text-sm">"{review.text}"</p>

                 <div className="border-t border-slate-100 pt-4 mt-auto">
                    <div className="flex items-center gap-2 mb-1">
                       <div className={`w-2 h-2 rounded-full ${review.brand === 'google' ? 'bg-[#4285F4]' : 'bg-[#009FD9]'}`} />
                       <p className={`text-[10px] font-black uppercase tracking-widest ${review.brand === 'google' ? 'text-[#4285F4]' : 'text-[#009FD9]'}`}>{review.source}</p>
                    </div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 truncate">{review.details}</p>
                 </div>
              </div>
           ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

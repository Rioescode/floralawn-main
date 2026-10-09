import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getBaseUrl } from '@/utils/seo-helpers';

const NAVY = '#1B2838';
const GREEN = '#2F6B4F';
const GOLD = '#E8C547';
const PAPER = '#F3F6F4';

const QUOTE_CLEANUP = '/contact?service=Fall%20Cleanup';
const QUOTE_LEAVES = '/contact?service=Leaf%20Removal';
const QUOTE_NEIGHBOR = '/contact?service=Fall%20Cleanup&promo=NEIGHBOR-10';
const PHONE = '4013890913';
const PHONE_LABEL = '(401) 389-0913';

const PAGES = {
  cleanup: {
    path: '/east-greenwich-ri/fall-cleanup',
    title: 'Fall Cleanup in East Greenwich, RI | Leaves, Beds & Lawn',
    description:
      'Fall cleanup in East Greenwich, RI (02818). Leaves, beds, and a last mow before winter. One visit or two. Free quote in 1 to 6 hours.',
    h1: 'Fall cleanup in East Greenwich, RI',
    lead: 'Leaves, beds, and lawn. Book before the oaks on the Hill drop the last of it.',
    image: '/images/fall-house-lawn.jpg',
    imageAlt: 'East Greenwich home with fall trees and a cleared front lawn',
    quote: QUOTE_CLEANUP,
    formName: 'Fall Cleanup',
  },
  leaves: {
    path: '/east-greenwich-ri/leaf-removal',
    title: 'Leaf Removal in East Greenwich, RI | Flora Lawn',
    description:
      'Leaf removal in East Greenwich, RI. Blow, rake, and haul for Hill District, Frenchtown, and 02818 yards. Free quote in 1 to 6 hours.',
    h1: 'Leaf removal in East Greenwich, RI',
    lead: 'Oaks and maples here bury a lawn in a week. We take them off the grass and off the property.',
    image: '/images/fall-house-leaves.jpg',
    imageAlt: 'Fallen leaves covering a Rhode Island lawn',
    quote: QUOTE_LEAVES,
    formName: 'Leaf Removal',
  },
  cost: {
    path: '/east-greenwich-ri/how-much-does-fall-cleanup-cost',
    title: 'Fall Cleanup Cost in East Greenwich, RI | Flora Lawn',
    description:
      'What fall cleanup costs in East Greenwich, RI. Lot size, tree cover, and one visit vs two. We quote your yard in 1 to 6 hours and confirm before work starts.',
    h1: 'How much does fall cleanup cost in East Greenwich?',
    lead: 'Price follows your lot, your trees, and whether you want one pass or two. We quote the yard you have, not a list price.',
    image: '/images/fall-house-hero.jpg',
    imageAlt: 'Fall house and lawn in Rhode Island',
    quote: QUOTE_CLEANUP,
    formName: 'Fall Cleanup',
  },
};

const NEIGHBORHOODS = [
  { name: 'Hill District', note: 'Steep lots, old oaks, leaves pile against stone walls.' },
  { name: 'Frenchtown', note: 'Bigger yards off South County Trail. Two visits often make sense.' },
  { name: 'Main Street', note: 'Tight downtown lots. We keep walks and the street clear.' },
  { name: 'Waterfront', note: 'Wind off the cove packs wet leaves into beds and drains.' },
];

function faqFor(kind) {
  if (kind === 'leaves') {
    return [
      {
        q: 'Do you only remove leaves, or is that part of fall cleanup?',
        a: 'Leaf removal is just the leaves: blow, rake, and haul. Fall cleanup adds a last mow, bed cleanup, and perennial cut-back. Pick leaves if the grass is the problem. Pick fall cleanup if you want the yard shut down for winter.',
      },
      {
        q: 'How often should East Greenwich yards get leaves pulled?',
        a: 'Most 02818 yards with mature trees need two passes: one after the first heavy drop in late October, one after the last oaks in November. A small downtown lot can be one visit.',
      },
      {
        q: 'Do you haul the leaves away?',
        a: 'Yes. We do not leave bags at the curb unless you ask. Town pickup days fill up; we take the load with us.',
      },
      {
        q: 'Do you serve Frenchtown and the Hill?',
        a: 'Yes. East Greenwich 02818, including Hill District, Frenchtown, Main Street, and the waterfront. West Greenwich is a separate page if that is your town.',
      },
    ];
  }
  if (kind === 'cost') {
    return [
      {
        q: 'Why does one East Greenwich yard cost more than the next?',
        a: 'Tree cover and slope. A Frenchtown acre under oaks takes longer than a small Main Street lot. Wet leaves and stone walls add time. We price the work, not the street name.',
      },
      {
        q: 'Is there a published price list?',
        a: 'No. We quote each yard after we see the address and photos. A typical East Greenwich fall cleanup often starts around $175. Larger, wooded lots run higher. We confirm the number before we start.',
      },
      {
        q: 'Does a second visit cost the same as the first?',
        a: 'Usually less. The second pass is the late oak drop, not a full first cleanup. We price both visits up front if you want the two-visit plan.',
      },
      {
        q: 'Can two neighbors split a day and save?',
        a: 'Yes. Book the same day as a neighbor and use NEIGHBOR-10 for 10% off each job. Same street, same crew, less drive time.',
      },
    ];
  }
  return [
    {
      q: 'When should I book fall cleanup in East Greenwich?',
      a: 'Now through mid-November. Oaks here hang on late. Book a first visit after the maples drop, and a second after the oaks, or one late visit if your lot is small.',
    },
    {
      q: 'What is included in fall cleanup?',
      a: 'Leaf removal, a last mow, bed cleanup, perennial cut-back, and debris hauled off. Gutters are extra if you want them done the same day.',
    },
    {
      q: 'How is this different from leaf removal?',
      a: 'Leaf removal is leaves only. Fall cleanup is the full winter shutdown. If you already mow and only need the leaves gone, book leaf removal.',
    },
    {
      q: 'Do you work the Hill District and Frenchtown?',
      a: 'Yes. All of East Greenwich 02818. Send the address and we tell you if we can take it this week.',
    },
  ];
}

function JsonLd({ kind, page }) {
  const base = getBaseUrl();
  const faqs = faqFor(kind);
  const serviceName = kind === 'leaves' ? 'Leaf Removal' : 'Fall Cleanup';
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: `${serviceName} in East Greenwich, RI`,
            serviceType: serviceName,
            areaServed: {
              '@type': 'City',
              name: 'East Greenwich',
              containedInPlace: { '@type': 'State', name: 'Rhode Island' },
            },
            provider: {
              '@type': 'LocalBusiness',
              name: 'Flora Lawn & Landscaping Inc',
              telephone: PHONE_LABEL,
              url: base,
            },
            url: `${base}${page.path}`,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: base },
              { '@type': 'ListItem', position: 2, name: 'East Greenwich', item: `${base}/east-greenwich-ri` },
              { '@type': 'ListItem', position: 3, name: page.h1, item: `${base}${page.path}` },
            ],
          }),
        }}
      />
    </>
  );
}

function Ctas({ quote, compact }) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${compact ? '' : 'sm:items-center'}`}>
      <Link
        href={quote}
        className="inline-flex items-center justify-center px-6 py-3.5 text-[15px] font-bold text-[#1B2838]"
        style={{ background: GOLD }}
      >
        Get a free quote
      </Link>
      <a
        href={`tel:${PHONE}`}
        className="inline-flex items-center justify-center px-6 py-3.5 text-[15px] font-bold text-white border border-white/30"
      >
        Call {PHONE_LABEL}
      </a>
    </div>
  );
}

function CleanupBody() {
  return (
    <>
      <section className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: NAVY }}>
            East Greenwich yards need a real last pass
          </h2>
          <p className="mt-5 text-[17px] leading-7 text-[#3d4a42]">
            02818 has mature oaks on the Hill and bigger lots out Frenchtown. Leaves sit on the grass, then they sit wet. That kills the turf you spent the summer on. We pull the leaves, cut the beds back, mow one last time, and haul the pile. You are not left with bags on Shippeetown Road waiting for town pickup.
          </p>
          <p className="mt-4 text-[17px] leading-7 text-[#3d4a42]">
            Book one visit if the lot is small. Book two if the oaks are still hanging on. We confirm the price before we start.
          </p>
        </div>
        <ul className="space-y-4">
          {[
            ['Leaves off the lawn', 'Blow, rake, and haul. No curb pile unless you want one.'],
            ['Last mow', 'Short enough to go into winter without matting.'],
            ['Beds and perennials', 'Cut back, sticks out, edges clean.'],
            ['Optional gutters', 'Same day if you add them on the quote.'],
          ].map(([title, body]) => (
            <li key={title} className="border-l-4 pl-4 py-1" style={{ borderColor: GREEN }}>
              <p className="font-semibold" style={{ color: NAVY }}>{title}</p>
              <p className="text-sm leading-6 text-[#5C6B62]">{body}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="px-4 py-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-4">
          <Link href="/east-greenwich-ri/leaf-removal" className="bg-white p-6 border border-[#C9D4CC]">
            <p className="font-semibold" style={{ color: NAVY }}>Need leaves only?</p>
            <p className="mt-2 text-sm text-[#5C6B62]">Leaf removal in East Greenwich, without the full winter shutdown.</p>
          </Link>
          <Link href="/east-greenwich-ri/how-much-does-fall-cleanup-cost" className="bg-white p-6 border border-[#C9D4CC]">
            <p className="font-semibold" style={{ color: NAVY }}>What does this cost?</p>
            <p className="mt-2 text-sm text-[#5C6B62]">How we price East Greenwich yards, and what changes the number.</p>
          </Link>
        </div>
      </section>
    </>
  );
}

function LeavesBody() {
  return (
    <>
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-2xl" style={{ color: NAVY }}>
          Leaf removal for 02818, not a generic “fall package”
        </h2>
        <div className="mt-8 grid md:grid-cols-3 gap-8">
          {[
            ['One visit', 'Small Main Street or waterfront lots. We come after the heavy drop and take the load.'],
            ['Two visits', 'Hill and Frenchtown oaks. First pass late October, second after the last drop.'],
            ['Weekly while they fall', 'If the canopy is thick and you want the lawn visible every week in November.'],
          ].map(([title, body]) => (
            <div key={title}>
              <p className="text-lg font-semibold" style={{ color: NAVY }}>{title}</p>
              <p className="mt-2 text-[15px] leading-6 text-[#5C6B62]">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-2xl text-[17px] leading-7 text-[#3d4a42]">
          Leaves left on Kentucky bluegrass and fescue through a wet November make snow mold in March. That is the whole reason to pull them now. We haul. You do not wait on the town calendar.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
          <Link href="/east-greenwich-ri/fall-cleanup" className="underline underline-offset-4" style={{ color: GREEN }}>
            Full fall cleanup instead
          </Link>
          <Link href="/east-greenwich-ri/how-much-does-fall-cleanup-cost" className="underline underline-offset-4" style={{ color: GREEN }}>
            Fall cleanup pricing
          </Link>
        </div>
      </section>
    </>
  );
}

function CostBody() {
  return (
    <>
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: NAVY }}>
          What moves the price
        </h2>
        <div className="mt-10 grid md:grid-cols-2 gap-x-12 gap-y-8">
          {[
            ['Lot size', 'A quarter acre on Main Street is a short stop. A wooded Frenchtown acre is a half day.'],
            ['Tree cover', 'Oaks and maples mean volume. Open lawns with two street trees are cheaper.'],
            ['Slope and access', 'The Hill adds time. Tight driveways and stone walls slow the blowers.'],
            ['Wet vs dry', 'Wet November leaves weigh more and clog. Dry days go faster.'],
            ['One visit vs two', 'Two visits cost more than one, less than two full cleanups. We price both up front.'],
            ['Haul and extras', 'Haul is included. Gutters, shrub cut-back, and a last mow add to a fall cleanup quote.'],
          ].map(([title, body]) => (
            <div key={title} className="border-t pt-4" style={{ borderColor: '#C9D4CC' }}>
              <p className="font-semibold" style={{ color: NAVY }}>{title}</p>
              <p className="mt-2 text-[15px] leading-6 text-[#5C6B62]">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 p-6 sm:p-8" style={{ background: NAVY }}>
          <p className="text-white text-xl font-semibold">Typical East Greenwich fall cleanup often starts around $175.</p>
          <p className="mt-3 text-[#C9D4CC] leading-7">
            That is a starting point for a normal residential lot, not a package. Wooded or steep yards run higher. We send the number in 1 to 6 hours and do not start until you say yes.
          </p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          <Link href="/east-greenwich-ri/fall-cleanup" className="bg-white p-6 border border-[#C9D4CC]">
            <p className="font-semibold" style={{ color: NAVY }}>See what fall cleanup includes</p>
            <p className="mt-2 text-sm text-[#5C6B62]">Leaves, last mow, beds, haul-away.</p>
          </Link>
          <Link href="/east-greenwich-ri/leaf-removal" className="bg-white p-6 border border-[#C9D4CC]">
            <p className="font-semibold" style={{ color: NAVY }}>Leaves only</p>
            <p className="mt-2 text-sm text-[#5C6B62]">Usually less than a full cleanup. Same crew.</p>
          </Link>
        </div>
      </section>
    </>
  );
}

export function eastGreenwichFallMetadata(kind) {
  const page = PAGES[kind];
  const base = getBaseUrl();
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `${base}${page.path}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `${base}${page.path}`,
      images: [{ url: `${base}${page.image}` }],
    },
  };
}

export default function EastGreenwichFall({ kind }) {
  const page = PAGES[kind];
  const faqs = faqFor(kind);

  return (
    <div className="min-h-screen" style={{ background: PAPER, color: NAVY }}>
      <JsonLd kind={kind} page={page} />
      <Navigation />

      <header className="relative min-h-[72vh] flex items-end">
        <Image
          src={page.image}
          alt={page.imageAlt}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #1B2838 8%, #1B2838cc 48%, #1B283840 100%)' }} />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-12 pt-36">
          <p className="text-sm font-semibold" style={{ color: GOLD }}>East Greenwich · 02818</p>
          <h1 className="mt-3 max-w-3xl text-4xl sm:text-6xl font-semibold tracking-tight text-white leading-[1.05]">
            {page.h1}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/85 leading-7">{page.lead}</p>
          <div className="mt-8">
            <Ctas quote={page.quote} />
          </div>
        </div>
      </header>

      <div className="border-y" style={{ background: '#fff', borderColor: '#C9D4CC' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-[#5C6B62]">
          <span>Kent County</span>
          <span>Hill · Frenchtown · Main Street · Waterfront</span>
          <span>Quote in 1 to 6 hours</span>
        </div>
      </div>

      {kind === 'cleanup' && <CleanupBody />}
      {kind === 'leaves' && <LeavesBody />}
      {kind === 'cost' && <CostBody />}

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-semibold tracking-tight" style={{ color: NAVY }}>
          Neighborhoods we already work
        </h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {NEIGHBORHOODS.map((n) => (
            <div key={n.name}>
              <p className="font-semibold" style={{ color: NAVY }}>{n.name}</p>
              <p className="mt-2 text-sm leading-6 text-[#5C6B62]">{n.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-8">
        <div className="max-w-6xl mx-auto p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6" style={{ background: GREEN }}>
          <div className="text-white">
            <p className="text-xl font-semibold">Two neighbors, same day, 10% off each.</p>
            <p className="mt-1 text-white/80 text-sm">Use NEIGHBOR-10. Best on the Hill and Frenchtown streets we already visit.</p>
          </div>
          <Link href={QUOTE_NEIGHBOR} className="inline-flex justify-center px-5 py-3 font-bold text-[#1B2838] shrink-0" style={{ background: GOLD }}>
            Book with a neighbor
          </Link>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-semibold tracking-tight" style={{ color: NAVY }}>
          Questions from East Greenwich
        </h2>
        <div className="mt-8 space-y-8">
          {faqs.map((item) => (
            <div key={item.q}>
              <h3 className="text-lg font-semibold" style={{ color: NAVY }}>{item.q}</h3>
              <p className="mt-2 text-[16px] leading-7 text-[#3d4a42]">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12" style={{ background: NAVY }}>
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight max-w-xl">
            Send the address. We quote the yard.
          </h2>
          <p className="mt-4 text-white/70 max-w-lg">
            Photos help. We reply in 1 to 6 hours and confirm the price before any work starts.
          </p>
          <div className="mt-8">
            <Ctas quote={page.quote} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

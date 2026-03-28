import Link from 'next/link';

const tiers = [
  {
    name: 'Free Listing',
    price: 'Free',
    period: 'forever',
    color: 'from-gray-50 to-gray-100',
    border: 'border-gray-200',
    badge: '',
    features: [
      'Basic name & address listing',
      'Appears in search results',
      'Parents can find you on the map',
      'Google Maps link',
    ],
    cta: 'Claim Free Listing',
    ctaStyle: 'bg-gray-800 text-white hover:bg-gray-900',
  },
  {
    name: 'Standard',
    price: 'RM 99',
    period: '/month',
    color: 'from-indigo-50 to-blue-50',
    border: 'border-indigo-300',
    badge: 'Most Popular',
    features: [
      'Everything in Free',
      '✅ Verified badge on listing',
      'Priority placement in results',
      'Phone & website displayed',
      'Opening hours shown',
      'Monthly analytics report',
    ],
    cta: 'Get Started',
    ctaStyle: 'bg-indigo-600 text-white hover:bg-indigo-700',
  },
  {
    name: 'Premium',
    price: 'RM 199',
    period: '/month',
    color: 'from-amber-50 to-orange-50',
    border: 'border-amber-400',
    badge: '⭐ Featured',
    features: [
      'Everything in Standard',
      '⭐ Featured placement (top of list)',
      'Gold highlighted card',
      'Up to 5 photos shown',
      'Direct enquiry button',
      'Priority customer support',
      'Social media promotion',
    ],
    cta: 'Go Premium',
    ctaStyle: 'bg-amber-500 text-white hover:bg-amber-600',
  },
];

export default function ForProviders() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-indigo-700 font-extrabold text-lg">
            <span>🏫</span> KinderRoute
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Back to map</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          🎯 For Kindergarten Providers
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          Reach parents who are<br />
          <span className="text-indigo-600">already looking for you</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          KinderRoute helps parents find kindergartens along their daily commute. List your school and get discovered by families in your neighbourhood — at exactly the right moment.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-700">
          <div className="flex items-center gap-2"><span className="text-2xl">👨‍👩‍👧</span><span><strong>Parents</strong> searching daily</span></div>
          <div className="flex items-center gap-2"><span className="text-2xl">📍</span><span><strong>Location-based</strong> discovery</span></div>
          <div className="flex items-center gap-2"><span className="text-2xl">📱</span><span><strong>Mobile-first</strong> experience</span></div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">Simple, transparent pricing</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div key={tier.name} className={`relative rounded-2xl border-2 ${tier.border} bg-gradient-to-b ${tier.color} p-6 flex flex-col`}>
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  {tier.badge}
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-gray-900">{tier.price}</span>
                  <span className="text-sm text-gray-500 mb-1">{tier.period}</span>
                </div>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">{f.startsWith('✅') || f.startsWith('⭐') ? '' : '✓'}</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a href={`mailto:hello@kinderroute.my?subject=${encodeURIComponent(`${tier.name} listing enquiry`)}`}
                className={`block w-full text-center py-3 rounded-xl font-bold text-sm transition-colors ${tier.ctaStyle}`}>
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        {/* FAQ-style section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Why list on KinderRoute?</h2>
          <div className="space-y-4">
            {[
              { q: 'How does it work?', a: 'Parents enter their daily commute route, and KinderRoute shows them kindergartens along the way. Your school appears on the map and in the results list for parents near your location.' },
              { q: 'How do I get started?', a: 'Email us at hello@kinderroute.my or click "Claim Listing" on your school\'s card in the search results. We\'ll verify ownership and activate your listing within 24 hours.' },
              { q: 'Can I update my school\'s information?', a: 'Yes — Standard and Premium subscribers get access to a dashboard to update photos, hours, fees, and contact details at any time.' },
              { q: 'Is there a contract?', a: 'No contracts. Standard and Premium plans are month-to-month. You can cancel any time.' },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-1">{q}</h3>
                <p className="text-sm text-gray-600">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 text-white max-w-md">
            <div className="text-3xl mb-2">🚀</div>
            <h3 className="text-xl font-bold mb-2">Ready to get started?</h3>
            <p className="text-sm text-indigo-200 mb-4">Join kindergartens already using KinderRoute to reach more families.</p>
            <a href="mailto:hello@kinderroute.my?subject=Listing+enquiry"
              className="block py-3 px-6 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors text-sm">
              Contact Us → hello@kinderroute.my
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

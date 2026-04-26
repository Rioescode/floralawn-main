'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';

const ReviewsSection = () => {
  const platforms = [
    {
      name: 'Google',
      rating: 4.8,
      reviews: '21',
      link: 'https://g.page/r/CZk9xIGxn-KHEAE'
    },
    {
      name: 'Thumbtack',
      rating: 4.8,
      reviews: 'Rest',
      link: 'https://www.thumbtack.com/fl/orlando/lawn-care/flora-landscaping/service/450321724081717249'
    }
  ];

  const stats = [
    { label: 'Same-Day Quotes', value: '100%' },
    { label: 'Satisfaction', value: '100%' },
    { label: 'Reviews', value: '100+' }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-green-600 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            100+ Reviews from Happy Customers
          </h2>
          <p className="text-lg text-gray-600">
            See what our customers are saying about us on trusted platforms
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-xl font-bold text-gray-900">
                  {platform.name}
                </div>
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-gray-900">{platform.rating}</span>
                  <div className="flex ml-2">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(platform.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">
                {platform.reviews} verified reviews
              </p>
              
              <a
                href={platform.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full text-center py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Read Reviews on {platform.name}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection; 

import React from 'react';
import { Star } from 'lucide-react';

type Testimonial = {
  id: number;
  author: string;
  text: string;
  rating: number;
  image?: string;
};

interface TestimonialsProps {
  testimonials: Testimonial[];
}

const Testimonials: React.FC<TestimonialsProps> = ({ testimonials }) => {
  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-[#d81570]">What Our Customers Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id} 
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 transition-transform hover:-translate-y-1"
            >
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              
              <p className="text-gray-600 italic mb-4">"{testimonial.text}"</p>
              
              <div className="flex items-center">
                {testimonial.image ? (
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.author}
                    className="w-10 h-10 rounded-full mr-3 object-cover" 
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#fce4f1] text-[#d81570] flex items-center justify-center mr-3">
                    {testimonial.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium">{testimonial.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;


import React, { useState } from 'react';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import Testimonials from '../components/Testimonials';
import ThemeToggle from '../components/ThemeToggle';
import ScrollToTop from '../components/ScrollToTop';
import useLocalStorage from '../hooks/useLocalStorage';

type Review = {
  id: number;
  author: string;
  text: string;
  rating: number;
  date: string;
};

const ReviewsPage = () => {
  // Get reviews from local storage
  const [reviews, setReviews] = useLocalStorage<Review[]>('customerReviews', [
    {
      id: 1,
      author: "Sarah Johnson",
      text: "The trade-in process was so smooth! Got a great price for my old iPhone and the upgrade was hassle-free.",
      rating: 5,
      date: "2025-02-15"
    },
    {
      id: 2,
      author: "Michael Chen",
      text: "I was skeptical at first, but the pricing was fair and the customer service was excellent.",
      rating: 4,
      date: "2025-03-22"
    },
    {
      id: 3,
      author: "Aisha Patel",
      text: "Compared prices everywhere, and Phone Matrix offered the best trade-in value by far. Highly recommend!",
      rating: 5,
      date: "2025-04-10"
    }
  ]);
  
  // State for the review form
  const [name, setName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !reviewText) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    const newReview: Review = {
      id: Date.now(),
      author: name,
      text: reviewText,
      rating,
      date: new Date().toISOString().split('T')[0]
    };
    
    setReviews([newReview, ...reviews]);
    
    // Reset form
    setName('');
    setReviewText('');
    setRating(5);
    
    toast({
      title: "Thank you!",
      description: "Your review has been submitted",
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-8 text-[#d81570] dark:text-[#ff7eb6]">Customer Reviews</h1>
        
        {/* Review Form */}
        <div className="max-w-2xl mx-auto mb-16 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Leave a Review</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-1 text-sm font-medium dark:text-gray-200">Your Name</label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="rating" className="block mb-1 text-sm font-medium dark:text-gray-200">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={`h-6 w-6 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-500'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="review" className="block mb-1 text-sm font-medium dark:text-gray-200">Your Review</label>
              <Textarea
                id="review"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with us"
                rows={4}
                className="dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#d81570] hover:bg-[#e83a8e]"
            >
              Submit Review
            </Button>
          </form>
        </div>
        
        {/* Display Reviews */}
        <Testimonials testimonials={reviews.map(review => ({
          id: review.id,
          author: review.author,
          text: review.text,
          rating: review.rating,
        }))} />
      </main>
      
      <ScrollToTop />
    </div>
  );
};

export default ReviewsPage;

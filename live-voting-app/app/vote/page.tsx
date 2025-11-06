'use client';

import { useEffect, useState } from 'react';
import { getFingerprint } from '@/lib/fingerprint';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Question {
  id: string;
  text: string;
  order: number;
}

// Farben für verschiedene Fragen
const QUESTION_COLORS = [
  { track: '#5B7FE8', thumb: '#4A6DD7' },
  { track: '#E8766B', thumb: '#D7655A' },
  { track: '#4A5978', thumb: '#394867' }
];

export default function VotePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fingerprint, setFingerprint] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      const fp = await getFingerprint();
      setFingerprint(fp);
      
      // Always check with server first (in case admin reset votes)
      const checkResponse = await fetch(`/api/votes/check?fp=${fp}`);
      const checkData = await checkResponse.json();
      
      if (checkData.hasVoted) {
        setHasVoted(true);
        localStorage.setItem('has_voted', 'true');
        setLoading(false);
        return;
      }
      
      // Server says we haven't voted, clear localStorage just in case
      localStorage.removeItem('has_voted');
      
      const questionsResponse = await fetch('/api/questions');
      const questionsData = await questionsResponse.json();
      setQuestions(questionsData);
      
      // Initialisiere Ratings mit 5.0 (Mitte)
      const initialRatings: Record<string, number> = {};
      questionsData.forEach((q: Question) => {
        initialRatings[q.id] = 5.0;
      });
      setRatings(initialRatings);
      
      setLoading(false);
    }
    
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Object.keys(ratings).length !== questions.length) {
      alert('Bitte bewerte alle Fragen!');
      return;
    }
    
    setSubmitting(true);
    
    const votes = questions.map(q => ({
      questionId: q.id,
      rating: ratings[q.id]
    }));
    
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votes, fingerprint })
      });
      
      if (response.ok) {
        localStorage.setItem('has_voted', 'true');
        setHasVoted(true);
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Abstimmen');
      }
    } catch (error) {
      alert('Netzwerkfehler beim Abstimmen');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-lg text-gray-600">Lädt...</div>
      </div>
    );
  }
  
  if (hasVoted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="p-12 max-w-md text-center shadow-xl">
          <div className="text-7xl mb-6">✓</div>
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Thank you!</h2>
          <p className="text-gray-600 text-lg">
            Your responses have been recorded.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">
            Please rate the following:
          </h1>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-12">
          {questions.map((question, index) => {
            const color = QUESTION_COLORS[index % QUESTION_COLORS.length];
            const value = ratings[question.id] || 5.0;
            
            return (
              <div key={question.id} className="space-y-4">
                <h3 className="text-xl font-medium text-gray-800">
                  {question.text}
                </h3>
                
                <div className="relative pt-6 pb-4">
                  {/* Slider Value Display */}
                  <div 
                    className="absolute transition-all duration-300 ease-out"
                    style={{ 
                      left: `calc(${(value / 10) * 100}% - 28px)`,
                      top: '-8px'
                    }}
                  >
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{ backgroundColor: color.thumb }}
                    >
                      {value.toFixed(1)}
                    </div>
                  </div>
                  
                  {/* Slider */}
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={value}
                    onChange={(e) => setRatings(prev => ({
                      ...prev,
                      [question.id]: parseFloat(e.target.value)
                    }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, ${color.track} 0%, ${color.track} ${(value / 10) * 100}%, #E5E7EB ${(value / 10) * 100}%, #E5E7EB 100%)`
                    }}
                  />
                  
                  {/* Labels */}
                  <div className="flex justify-between mt-3 text-sm text-gray-500">
                    <span>Don&apos;t agree at all</span>
                    <span>Very much agree</span>
                  </div>
                </div>
              </div>
            );
          })}
          
          <Button 
            type="submit" 
            className="w-full py-6 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Responses'}
          </Button>
        </form>
      </div>
      
      <style jsx global>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        
        .slider::-webkit-slider-thumb:active {
          transform: scale(1.3);
        }
        
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
}


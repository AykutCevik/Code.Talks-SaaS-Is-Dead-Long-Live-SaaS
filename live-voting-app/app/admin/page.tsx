'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import * as d3 from 'd3-shape';

interface VoteDistribution {
  value: number;
  count: number;
}

interface QuestionStats {
  questionId: string;
  questionText: string;
  totalVotes: number;
  average: number;
  distribution: VoteDistribution[];
}

const QUESTION_COLORS = [
  { base: '#5B7FE8', light: 'rgba(91, 127, 232, 0.3)' },
  { base: '#E8766B', light: 'rgba(232, 118, 107, 0.3)' },
  { base: '#4A5978', light: 'rgba(74, 89, 120, 0.3)' }
];

function DistributionCurve({ 
  distribution, 
  average, 
  color, 
  totalVotes 
}: { 
  distribution: VoteDistribution[];
  average: number;
  color: { base: string; light: string };
  totalVotes: number;
}) {
  const width = 800;
  const height = 100;
  const padding = 20;
  
  // Generiere smooth Curve Path
  const maxCount = Math.max(...distribution.map(d => d.count), 1);
  
  const points = distribution.map((d, i) => ({
    x: padding + (i / 10) * (width - 2 * padding),
    y: height - padding - ((d.count / maxCount) * (height - 2 * padding))
  }));
  
  // D3 Curve Generator
  const lineGenerator = d3.line<{ x: number; y: number }>()
    .x(d => d.x)
    .y(d => d.y)
    .curve(d3.curveBasis);
  
  const areaGenerator = d3.area<{ x: number; y: number }>()
    .x(d => d.x)
    .y0(height - padding)
    .y1(d => d.y)
    .curve(d3.curveBasis);
  
  const linePath = lineGenerator(points) || '';
  const areaPath = areaGenerator(points) || '';
  
  const averageX = padding + (average / 10) * (width - 2 * padding);
  
  return (
    <div className="relative">
      <svg width={width} height={height} className="w-full">
        {/* Area Fill */}
        <motion.path
          d={areaPath}
          fill={color.light}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Line */}
        <motion.path
          d={linePath}
          stroke={color.base}
          strokeWidth={3}
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8 }}
        />
        
        {/* Scale */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} 
              stroke="#ccc" strokeWidth={2} />
        <text x={padding} y={height - 5} fontSize={12} fill="#999">0</text>
        <text x={width - padding - 10} y={height - 5} fontSize={12} fill="#999">10</text>
      </svg>
      
      {/* Average Marker */}
      <motion.div
        className="absolute flex items-center justify-center rounded-full text-white font-bold shadow-lg"
        style={{
          width: '60px',
          height: '60px',
          backgroundColor: color.base,
          left: `${averageX}px`,
          top: '20px',
          transform: 'translateX(-30px)'
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        key={`${average}-${totalVotes}`}
      >
        <span className="text-xl">{average.toFixed(1)}</span>
      </motion.div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<QuestionStats[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    // Generate QR Code
    const voteUrl = `${window.location.origin}/vote`;
    QRCode.toDataURL(voteUrl, { 
      width: 400, 
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    }).then(setQrCodeUrl);

    // Initial data laden
    fetchStats();

    // SSE Connection für Live-Updates
    const eventSource = new EventSource('/api/votes/stream');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStats(data);
      
      // Berechne Teilnehmer (jeder gibt 3 Votes ab)
      if (data.length > 0) {
        setTotalParticipants(Math.round(data[0].totalVotes));
      }
    };

    eventSource.onerror = () => {
      console.error('SSE error, falling back to polling');
      eventSource.close();
      
      // Fallback: Polling
      const interval = setInterval(fetchStats, 2000);
      return () => clearInterval(interval);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchStats = async () => {
    const response = await fetch('/api/votes/stats');
    const data = await response.json();
    setStats(data);
    
    if (data.length > 0) {
      setTotalParticipants(Math.round(data[0].totalVotes));
    }
  };

  const handleReset = async () => {
    if (!confirm('Wirklich alle Votes löschen?')) return;
    
    setIsResetting(true);
    const secret = prompt('Admin Secret:');
    
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'x-admin-secret': secret || '' }
      });
      
      if (response.ok) {
        alert('Votes erfolgreich zurückgesetzt');
        fetchStats();
      } else {
        alert('Fehler: Ungültiges Secret');
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            SaaS is Dead, Long Live SaaS
          </h1>
          <Button 
            onClick={handleReset} 
            variant="outline"
            disabled={isResetting}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Reset Votes
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* QR Code Section */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 sticky top-8">
              {qrCodeUrl && (
                <div className="flex flex-col items-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-full max-w-[300px] rounded-xl" />
                  <p className="text-gray-600 text-center mt-6 font-medium text-lg">
                    Scan to participate
                  </p>
                  <div className="mt-4 text-sm text-gray-500">
                    {window.location.origin}/vote
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Questions Section */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {stats.map((question, index) => {
              const color = QUESTION_COLORS[index % QUESTION_COLORS.length];
              
              return (
                <div key={question.questionId} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">
                    {question.questionText}
                  </h3>
                  
                  <DistributionCurve
                    distribution={question.distribution}
                    average={question.average}
                    color={color}
                    totalVotes={question.totalVotes}
                  />
                  
                  <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                    <span>Don&apos;t agree at all</span>
                    <span>Very much agree</span>
                  </div>
                </div>
              );
            })}
            
            {/* Participant Counter */}
            <div className="flex justify-end items-center gap-2 text-gray-600">
              <div className="bg-gray-800 text-white px-4 py-2 rounded-full font-medium">
                {totalParticipants} / {totalParticipants}
              </div>
              <span className="text-2xl">👤</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


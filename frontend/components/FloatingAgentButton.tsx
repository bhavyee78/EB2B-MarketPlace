'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SalesAgentModal from './SalesAgentModal';

export default function FloatingAgentButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showMinimizedIndicator, setShowMinimizedIndicator] = useState(false);
  const { user } = useAuth();

  // Show popup message when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(true);
      
      // Hide popup after 3 seconds
      const hideTimer = setTimeout(() => {
        setShowPopup(false);
      }, 3000);

      return () => clearTimeout(hideTimer);
    }, 1000); // Show popup 1 second after app loads

    return () => clearTimeout(timer);
  }, []);

  const handleAgentClick = () => {
    if (isMinimized) {
      // If minimized, restore the modal
      setIsMinimized(false);
      setIsModalOpen(true);
    } else {
      // If not open, open the modal
      setIsModalOpen(true);
    }
    setShowPopup(false); // Hide popup when opening modal
  };

  const handleMinimize = () => {
    setIsModalOpen(false);
    setIsMinimized(true);
    setShowMinimizedIndicator(true);
    
    // Hide the minimized indicator after 3 seconds
    setTimeout(() => {
      setShowMinimizedIndicator(false);
    }, 3000);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Popup Message - positioned above button */}
      {showPopup && !isMinimized && (
        <div className="fixed bottom-40 right-2 z-40">
          <div className="relative bg-red-500 rounded-lg shadow-lg p-3 max-w-48">
            <div className="text-sm font-medium text-white">
              Place an order on chat
            </div>
            {/* Arrow pointing down to button */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-red-500 transform rotate-45"></div>
          </div>
        </div>
      )}

      {/* Minimized Chat Indicator */}
      {showMinimizedIndicator && (
        <div className="fixed bottom-40 right-2 z-40">
          <div className="relative bg-blue-500 rounded-lg shadow-lg p-3 max-w-48">
            <div className="text-sm font-medium text-white">
              Chat minimized - Click to restore
            </div>
            {/* Arrow pointing down to button */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-blue-500 transform rotate-45"></div>
          </div>
        </div>
      )}

      {/* Floating Agent Button */}
      <button
        onClick={handleAgentClick}
        className={`fixed bottom-24 right-6 z-30 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border ${
          isMinimized 
            ? 'bg-blue-500 border-blue-600' 
            : 'bg-white border-gray-200'
        }`}
      >
        {isMinimized ? (
          <div className="flex items-center justify-center w-full h-full">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
        ) : (
          <div className="w-full h-full rounded-full overflow-hidden">
            <Image
              src="/agent.jpeg"
              alt="Sales Agent"
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </button>

      {/* Sales Agent Modal */}
      <SalesAgentModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onMinimize={handleMinimize}
        userId={user?.id || 'guest-user'}
      />
    </>
  );
}
import React, { useState } from 'react';

const MobileNavTest: React.FC = () => {
  const [currentScreenSize, setCurrentScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  React.useEffect(() => {
    const handleResize = () => {
      setCurrentScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = currentScreenSize.width < 640;
  const isSmallMobile = currentScreenSize.width <= 375;

  return (
    <div className="fixed bottom-4 right-4 z-[10000] bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs">
      <h3 className="text-sm font-bold text-gray-800 mb-2">Mobile Nav Test</h3>
      <div className="text-xs space-y-1">
        <div>Width: {currentScreenSize.width}px</div>
        <div>Height: {currentScreenSize.height}px</div>
        <div className={`font-semibold ${isMobile ? 'text-green-600' : 'text-red-600'}`}>
          Mobile: {isMobile ? 'Yes' : 'No'}
        </div>
        <div className={`font-semibold ${isSmallMobile ? 'text-orange-600' : 'text-blue-600'}`}>
          Small Mobile: {isSmallMobile ? 'Yes' : 'No'}
        </div>
        <div className="text-gray-600 mt-2">
          {isSmallMobile && (
            <div className="text-orange-600 font-semibold">
              ⚠️ Test 375x667 layout
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileNavTest; 
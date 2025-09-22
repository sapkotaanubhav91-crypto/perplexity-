import React from 'react';
import AntharaIcon from './FeatherIcon';

const Header: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4">
      <div className="relative">
        <div className="px-5 py-2 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-600">Looking for something specific?</p>
        </div>
        {/* Speech bubble triangle */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-200" />
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[-1px] w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-white" />
      </div>
      <AntharaIcon className="w-14 h-14 mt-2" />
    </div>
  );
};

export default Header;
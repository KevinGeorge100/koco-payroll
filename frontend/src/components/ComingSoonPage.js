import React from 'react';
import { Calendar, Plus } from 'lucide-react';

const ComingSoonPage = ({ title, description, icon: Icon = Calendar }) => {
  return (
    <div className="min-h-96 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <Icon className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6 max-w-md">
          {description}
        </p>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Coming Soon
        </button>
      </div>
    </div>
  );
};

export default ComingSoonPage;
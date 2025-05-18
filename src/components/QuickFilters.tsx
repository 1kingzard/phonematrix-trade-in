
import React from 'react';
import { Button } from '@/components/ui/button';

interface QuickFiltersProps {
  filters: string[];
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  type: 'brand' | 'condition' | 'storage';
}

const QuickFilters: React.FC<QuickFiltersProps> = ({ 
  filters, 
  activeFilter, 
  onFilterChange,
  type
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
      <Button
        variant={activeFilter === null ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange(null)}
        className={activeFilter === null ? "bg-[#d81570] hover:bg-[#e83a8e]" : ""}
      >
        All
      </Button>
      
      {filters.map((filter) => (
        <Button
          key={filter}
          variant={activeFilter === filter ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter)}
          className={activeFilter === filter ? "bg-[#d81570] hover:bg-[#e83a8e]" : ""}
        >
          {filter}
        </Button>
      ))}
    </div>
  );
};

export default QuickFilters;

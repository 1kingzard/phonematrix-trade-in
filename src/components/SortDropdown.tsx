
import React from 'react';
import { ArrowDown, ArrowUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type SortOption = {
  label: string;
  value: string;
  direction: 'asc' | 'desc';
};

interface SortDropdownProps {
  options: SortOption[];
  onSort: (option: SortOption) => void;
  activeOption?: SortOption;
}

const SortDropdown: React.FC<SortDropdownProps> = ({ options, onSort, activeOption }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span>Sort {activeOption ? `by ${activeOption.label}` : ''}</span>
          {activeOption && (activeOption.direction === 'asc' ? 
            <ArrowUp className="h-3 w-3" /> : 
            <ArrowDown className="h-3 w-3" />)
          }
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {options.map((option) => (
          <DropdownMenuItem 
            key={`${option.value}-${option.direction}`}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onSort(option)}
          >
            {option.label}
            {option.direction === 'asc' ? 
              <ArrowUp className="h-3 w-3" /> : 
              <ArrowDown className="h-3 w-3" />
            }
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SortDropdown;

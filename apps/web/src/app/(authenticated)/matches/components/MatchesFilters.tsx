'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover"
import { Filter, X } from 'lucide-react'

interface FilterOptions {
  ageRange: { min: number; max: number }
  location: string
  education: string
  religiousLevel: string
  maritalStatus: string
}

export function MatchesFilters() {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    ageRange: { min: 21, max: 35 },
    location: '',
    education: '',
    religiousLevel: '',
    maritalStatus: 'single'
  })

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      ageRange: { min: 21, max: 35 },
      location: '',
      education: '',
      religiousLevel: '',
      maritalStatus: 'single'
    })
  }

  const activeFiltersCount = Object.values(filters).filter(value => 
    typeof value === 'string' ? value !== '' : true
  ).length - 1 // Subtract 1 for default ageRange

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4 bg-white rounded-lg shadow-lg border">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900">Filter Matches</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Age Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              Age Range
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={filters.ageRange.min}
                onChange={(e) => handleFilterChange('ageRange', {
                  ...filters.ageRange,
                  min: parseInt(e.target.value) || 21
                })}
                className="w-16 px-2 py-1 border rounded text-sm"
                min="18"
                max="60"
              />
              <span className="text-neutral-500">to</span>
              <input
                type="number"
                value={filters.ageRange.max}
                onChange={(e) => handleFilterChange('ageRange', {
                  ...filters.ageRange,
                  max: parseInt(e.target.value) || 35
                })}
                className="w-16 px-2 py-1 border rounded text-sm"
                min="18"
                max="60"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              Location
            </label>
            <Select
              value={filters.location}
              onValueChange={(value) => handleFilterChange('location', value)}
            >
              <option value="">Any location</option>
              <option value="same-city">Same city</option>
              <option value="same-state">Same state</option>
              <option value="same-country">Same country</option>
            </Select>
          </div>

          {/* Education */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              Education Level
            </label>
            <Select
              value={filters.education}
              onValueChange={(value) => handleFilterChange('education', value)}
            >
              <option value="">Any education</option>
              <option value="high-school">High School</option>
              <option value="bachelors">Bachelor's Degree</option>
              <option value="masters">Master's Degree</option>
              <option value="doctorate">Doctorate</option>
            </Select>
          </div>

          {/* Religious Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              Religious Observance
            </label>
            <Select
              value={filters.religiousLevel}
              onValueChange={(value) => handleFilterChange('religiousLevel', value)}
            >
              <option value="">Any level</option>
              <option value="learning">Learning & Growing</option>
              <option value="practicing">Practicing</option>
              <option value="devout">Very Devout</option>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex-1"
            >
              Clear All
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
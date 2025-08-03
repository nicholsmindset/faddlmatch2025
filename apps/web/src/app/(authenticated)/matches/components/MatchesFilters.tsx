'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
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
              <SelectTrigger>
                <SelectValue placeholder="Any location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any location</SelectItem>
                <SelectItem value="same-city">Same city</SelectItem>
                <SelectItem value="same-state">Same state</SelectItem>
                <SelectItem value="same-country">Same country</SelectItem>
              </SelectContent>
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
              <SelectTrigger>
                <SelectValue placeholder="Any education" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any education</SelectItem>
                <SelectItem value="high-school">High School</SelectItem>
                <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                <SelectItem value="masters">Master's Degree</SelectItem>
                <SelectItem value="doctorate">Doctorate</SelectItem>
              </SelectContent>
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
              <SelectTrigger>
                <SelectValue placeholder="Any level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any level</SelectItem>
                <SelectItem value="learning">Learning & Growing</SelectItem>
                <SelectItem value="practicing">Practicing</SelectItem>
                <SelectItem value="devout">Very Devout</SelectItem>
              </SelectContent>
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
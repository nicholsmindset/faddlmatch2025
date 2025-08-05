import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Sparkles, Heart, Eye, MessageCircle } from 'lucide-react';

interface UpgradePromptProps {
  type: 'daily-limit' | 'profile-views' | 'success-story';
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ type }) => {
  const prompts = {
    'daily-limit': {
      icon: Heart,
      title: 'Unlock Unlimited Matches',
      description: 'You\'ve reached your daily limit. Upgrade to see unlimited matches every day!',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    'profile-views': {
      icon: Eye,
      title: 'See Who Viewed Your Profile',
      description: 'Multiple people viewed your profile. Upgrade to see who\'s interested!',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    'success-story': {
      icon: Sparkles,
      title: 'Join 2,000+ Success Stories',
      description: 'Many couples found their soulmate here. Start your journey today!',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  };

  const prompt = prompts[type];
  const Icon = prompt.icon;

  return (
    <div className={`rounded-xl p-6 border ${prompt.bgColor} border-neutral-100`}>
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 ${prompt.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${prompt.color}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-neutral-900 mb-2">{prompt.title}</h3>
          <p className="text-sm text-neutral-600 mb-4">{prompt.description}</p>
          <Link href="/subscription">
            <Button variant="primary" size="sm" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

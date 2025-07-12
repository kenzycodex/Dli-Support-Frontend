// components/alerts/CrisisAlert.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface CrisisAlertProps {
  crisisCount: number;
  userRole?: string;
  onViewCrisis: () => void;
}

export function CrisisAlert({ crisisCount, userRole, onViewCrisis }: CrisisAlertProps) {
  if (userRole === 'student' || crisisCount === 0) {
    return null;
  }

  return (
    <Card className="border-red-200 bg-red-50 shadow-xl">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="p-3 bg-red-500 rounded-full flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">
              🚨 Crisis Cases Require Immediate Attention
            </h3>
            <p className="text-red-700">{crisisCount} crisis ticket(s) need urgent response.</p>
          </div>
          <Button
            onClick={onViewCrisis}
            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
          >
            View Crisis Cases
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// components/shared/HelpSupportFooter.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileText, Plus } from 'lucide-react';

interface HelpSupportFooterProps {
  userRole?: string;
  onNavigate?: (page: string) => void;
  onCreateTicket: () => void;
}

export function HelpSupportFooter({
  userRole,
  onNavigate,
  onCreateTicket,
}: HelpSupportFooterProps) {
  return (
    <div className="w-full">
      <Card className="border-0 shadow-xl w-full">
        <CardContent className="px-4 sm:px-6 py-3">
          <div className="text-center space-y-2">
            {/* <h3 className="text-sm font-semibold text-gray-900">Need Help?</h3> */}

            <div className="flex justify-center flex-wrap gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                className="min-w-[110px]"
                onClick={() => onNavigate?.('help')}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Help Center
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-w-[110px]"
                onClick={() => onNavigate?.('resources')}
              >
                <FileText className="h-4 w-4 mr-1" />
                Resources
              </Button>
              {userRole === 'student' && (
                <Button
                  size="sm"
                  className="min-w-[140px]"
                  onClick={onCreateTicket}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Ticket
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-500">
              For emergencies, please contact 911 immediately.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
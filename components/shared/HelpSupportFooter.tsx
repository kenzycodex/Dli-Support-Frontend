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
    <Card className="border-0 shadow-xl">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Need Help?</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" onClick={() => onNavigate?.('help')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Help Center
            </Button>
            <Button variant="outline" onClick={() => onNavigate?.('resources')}>
              <FileText className="h-4 w-4 mr-2" />
              Resources
            </Button>
            {userRole === 'student' && (
              <Button onClick={onCreateTicket}>
                <Plus className="h-4 w-4 mr-2" />
                Submit New Ticket
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            For immediate assistance with crisis situations, please contact emergency services at
            911
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

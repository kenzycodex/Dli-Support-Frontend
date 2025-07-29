// utils/helpers.ts
export function getStatusColor(status: string): string {
  switch (status) {
    case 'Open':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'In Progress':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Resolved':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'Closed':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'Urgent':
      return 'bg-red-100 text-red-800 border-red-200 animate-pulse'
    case 'High':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'Medium':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}
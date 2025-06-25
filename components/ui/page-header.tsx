import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  description: string
  stats?: Array<{
    value: string
    label: string
  }>
  className?: string
}

export function PageHeader({ icon: Icon, title, description, stats, className }: PageHeaderProps) {
  return (
    <div className={cn("relative bg-gradient-to-br rounded-2xl p-6 sm:p-8 text-white overflow-hidden", className)}>
      <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
      <div className="absolute top-4 right-4 opacity-20">
        <Icon className="h-24 w-24" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm">
            <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
            <p className="text-base sm:text-lg text-white/80">{description}</p>
          </div>
        </div>
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mt-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/10 rounded-xl p-3 sm:p-4 backdrop-blur-sm border border-white/20">
                <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 
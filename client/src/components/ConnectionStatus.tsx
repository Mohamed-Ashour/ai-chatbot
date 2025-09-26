'use client'

import { motion } from 'framer-motion'
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react'
import { ConnectionStatus as ConnectionStatusType } from '@/types/chat'
import { cn } from '@/lib/utils'

interface ConnectionStatusProps {
  status: ConnectionStatusType
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const getStatusConfig = (status: ConnectionStatusType) => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800'
        }
      case 'connecting':
        return {
          icon: Loader2,
          text: 'Connecting...',
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        }
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Connection Error',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        }
      case 'disconnected':
      default:
        return {
          icon: WifiOff,
          text: 'Disconnected',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800'
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium',
        config.color,
        config.bgColor,
        config.borderColor
      )}
    >
      <Icon
        size={16}
        className={cn(
          status === 'connecting' && 'animate-spin'
        )}
      />
      <span>{config.text}</span>
    </motion.div>
  )
}
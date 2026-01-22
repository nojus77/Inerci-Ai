'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Users, ClipboardList, FileText } from 'lucide-react'
import { AddClientModal } from './AddClientModal'
import { AddTaskModal } from './AddTaskModal'
import { AddProposalModal } from './AddProposalModal'

interface QuickActionsModalProps {
  open: boolean
  onClose: () => void
}

export function QuickActionsModal({ open, onClose }: QuickActionsModalProps) {
  const { t } = useLanguage()
  const [showAddClient, setShowAddClient] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddProposal, setShowAddProposal] = useState(false)

  const handleClientClick = () => {
    onClose()
    setShowAddClient(true)
  }

  const handleTaskClick = () => {
    onClose()
    setShowAddTask(true)
  }

  const handleProposalClick = () => {
    onClose()
    setShowAddProposal(true)
  }

  const actions = [
    {
      key: 'client',
      title: t.header.newClient,
      description: t.modals.addClientDescription,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      hoverBg: 'hover:bg-blue-500/20',
      onClick: handleClientClick,
    },
    {
      key: 'task',
      title: t.header.newTask,
      description: t.modals.addTaskDescription,
      icon: ClipboardList,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      hoverBg: 'hover:bg-amber-500/20',
      onClick: handleTaskClick,
    },
    {
      key: 'proposal',
      title: t.header.newProposal || 'New Proposal',
      description: t.header.newProposalDescription || 'Create a new proposal for a client',
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      hoverBg: 'hover:bg-purple-500/20',
      onClick: handleProposalClick,
    },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {t.header.quickActions}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {actions.map((action) => (
              <button
                key={action.key}
                onClick={action.onClick}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border border-border/50 transition-all ${action.hoverBg} hover:border-border hover:shadow-md group`}
              >
                <div className={`p-4 rounded-full ${action.bgColor} mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`h-8 w-8 ${action.color}`} />
                </div>
                <h3 className="font-semibold text-base mb-1">{action.title}</h3>
                <p className="text-xs text-muted-foreground text-center line-clamp-2">
                  {action.description}
                </p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AddClientModal
        open={showAddClient}
        onClose={() => setShowAddClient(false)}
      />
      <AddTaskModal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
      />
      <AddProposalModal
        open={showAddProposal}
        onClose={() => setShowAddProposal(false)}
      />
    </>
  )
}

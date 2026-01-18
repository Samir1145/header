// src/components/ChatLogTable.tsx
import { useEffect, useState } from 'react'
import { getChatLogs, ChatLog } from '@/api/sqliteApi'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

const ChatLogTable = () => {
  const [logs, setLogs] = useState<ChatLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getChatLogs()
        setLogs(data)
      } catch (err: any) {
        console.error('Error fetching chat logs:', err)
        setError(err.message || 'Failed to load chat logs')
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return `${date.toISOString().split('T')[0]} ${date.toTimeString().slice(0, 5)}`
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <Card className="!rounded-none !overflow-hidden flex flex-col h-full min-h-0">
        <CardHeader className="py-2 px-6">
          <CardTitle className="text-lg">User Chat Logs</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="!rounded-none !overflow-hidden flex flex-col h-full min-h-0">
        <CardHeader className="py-2 px-6">
          <CardTitle className="text-lg">User Chat Logs</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="!rounded-none !overflow-hidden flex flex-col h-full min-h-0">
      <CardHeader className="py-2 px-6">
        <CardTitle className="text-lg">User Chat Logs</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 overflow-auto">
        <div className="overflow-auto rounded-md border">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 rounded-tl-md">User</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Date/Time</th>
                <th className="px-4 py-3">Question</th>
                <th className="px-4 py-3 rounded-tr-md">Answer</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No chat logs found
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-gray-800">{log.email || 'Anonymous'}</td>
                    <td className="px-4 py-3 text-gray-700">{log.ip_address || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3 text-gray-700">{log.question}</td>
                    <td className="px-4 py-3 text-gray-700">{log.answer || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default ChatLogTable

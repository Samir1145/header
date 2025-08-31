// src/components/ChatLogTable.tsx
import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface ChatLog {
  id: string
  email: string
  ipAddress: string
  question: string
  answer: string
  createdAt: { seconds: number; nanoseconds: number }
}

const ChatLogTable = () => {
  const [logs, setLogs] = useState<ChatLog[]>([])

  useEffect(() => {
    const fetchLogs = async () => {
      const q = query(collection(db, 'user_qna'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatLog[]
      setLogs(data)
    }

    fetchLogs()
  }, [])

  const formatDate = (ts: ChatLog['createdAt']) => {
    const date = new Date(ts.seconds * 1000)
    return `${date.toISOString().split('T')[0]} ${date.toTimeString().slice(0, 5)}`
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
            {logs.map(log => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-3 font-medium text-gray-800">{log.email}</td>
                <td className="px-4 py-3 text-gray-700">{log.ipAddress}</td>
                <td className="px-4 py-3 text-gray-700">{formatDate(log.createdAt)}</td>
                <td className="px-4 py-3 text-gray-700">{log.question}</td>
                <td className="px-4 py-3 text-gray-700">{log.answer}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default ChatLogTable

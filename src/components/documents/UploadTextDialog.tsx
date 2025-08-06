import { useState } from 'react'
import Button from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/Dialog'

import { LetterText, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { insertTexts } from '@/api/lightrag'
import { useTranslation } from 'react-i18next'

interface UploadTextDialogProps {
  onTextInserted?: () => Promise<void>
}

export default function UploadTextDialog({ onTextInserted }: UploadTextDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [texts, setTexts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleAddText = () => {
    const trimmed = textInput.trim()
    if (trimmed.length > 0) {
      setTexts((prev) => [...prev, trimmed])
      setTextInput('')
    } else {
      toast.warning(t('Please enter non-empty text.'))
    }
  }

  const handleRemoveText = (index: number) => {
    setTexts((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (texts.length === 0) {
      toast.warning(t('No text entries to insert.'))
      return
    }

    const toastId = toast.loading(t('Uploading texts...'))
    setLoading(true)

    try {
      const result = await insertTexts(texts)
      toast.success(result.message || t('Text(s) inserted successfully.'), { id: toastId })

      if (onTextInserted) await onTextInserted()

      setTexts([])
      setTextInput('')
      setOpen(false)
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || err?.message || t('Failed to insert texts.')
      toast.error(message, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!loading) {
          setOpen(isOpen)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <LetterText className="mr-1 h-4 w-4" />
          {t('Insert Text')}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('Insert Text')}</DialogTitle>
          <DialogDescription>
            {t('Insert one or more custom text entries into the RAG system.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <textarea
            placeholder={t('Enter a text snippet')}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={6}
            className={`border-input focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm 
                shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed 
                disabled:opacity-50 `}
                
            disabled={loading}
          ></textarea>

          <Button
            variant="secondary"
            onClick={handleAddText}
            disabled={loading || !textInput.trim()}
          >
            {t('Add Text')}
          </Button>

          {texts.length > 0 && (
            <div className="max-h-48 overflow-auto border rounded-md p-2">
              {texts.map((txt, index) => (
                <div key={index} className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 text-sm text-muted-foreground whitespace-pre-wrap">
                    {txt.length > 300 ? txt.slice(0, 300) + '…' : txt}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveText(index)}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSubmit} disabled={loading || texts.length === 0} >
            {t('Submit All')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

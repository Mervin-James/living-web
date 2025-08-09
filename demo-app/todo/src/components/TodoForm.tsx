import { useState } from 'react'
import type { TodoItem, TodoPriority } from '../types'
import { generateId, normalizeTags } from '../utils'

interface TodoFormProps {
  onAdd: (item: TodoItem) => void
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [assignee, setAssignee] = useState('')
  const [link, setLink] = useState('')
  const [priority, setPriority] = useState<TodoPriority>('none')
  const [tags, setTags] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const item: TodoItem = {
      id: generateId(),
      title: title.trim(),
      notes: notes.trim(),
      dueDate: dueDate && dueDate.length > 0 ? dueDate : null,
      assignee: assignee.trim(),
      link: link.trim(),
      done: false,
      priority,
      tags: normalizeTags(tags),
      createdAt: Date.now(),
    }
    onAdd(item)
    setTitle('')
    setNotes('')
    setDueDate(null)
    setAssignee('')
    setLink('')
    setPriority('none')
    setTags('')
  }

  return (
    <form className="grid gap-2" onSubmit={handleSubmit}>
      <input className="border rounded px-3 py-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <input className="border rounded px-3 py-2" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <input className="border rounded px-3 py-2" type="date" value={dueDate ?? ''} onChange={(e) => setDueDate(e.target.value || null)} />
      <input className="border rounded px-3 py-2" placeholder="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
      <input className="border rounded px-3 py-2" placeholder="Link (https://...)" value={link} onChange={(e) => setLink(e.target.value)} />
      <select className="border rounded px-3 py-2" value={priority} onChange={(e) => setPriority(e.target.value as TodoPriority)}>
        <option value="none">Priority: None</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <input className="border rounded px-3 py-2" placeholder="tags, comma, separated" value={tags} onChange={(e) => setTags(e.target.value)} />
      <button className="border rounded px-3 py-2 bg-gray-900 text-white hover:bg-black" type="submit" data-destination="true">Add</button>
    </form>
  )
}


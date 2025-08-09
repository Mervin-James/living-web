import { useState } from 'react'
import Element from './Element'
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
      <Element elementId="form-title"><input className="border rounded px-3 py-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required /></Element>
      <Element elementId="form-notes"><input className="border rounded px-3 py-2" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} /></Element>
      <Element elementId="form-date"><input className="border rounded px-3 py-2" type="date" value={dueDate ?? ''} onChange={(e) => setDueDate(e.target.value || null)} /></Element>
      <Element elementId="form-assignee"><input className="border rounded px-3 py-2" placeholder="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} /></Element>
      <Element elementId="form-link"><input className="border rounded px-3 py-2" placeholder="Link (https://...)" value={link} onChange={(e) => setLink(e.target.value)} /></Element>
      <Element elementId="form-priority"><select className="border rounded px-3 py-2" value={priority} onChange={(e) => setPriority(e.target.value as TodoPriority)}>
        <option value="none">Priority: None</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select></Element>
      <Element elementId="form-tags"><input className="border rounded px-3 py-2" placeholder="tags, comma, separated" value={tags} onChange={(e) => setTags(e.target.value)} /></Element>
      <Element elementId="form-add"><button className="border rounded px-3 py-2 bg-gray-900 text-white hover:bg-black" type="submit">Add</button></Element>
    </form>
  )
}


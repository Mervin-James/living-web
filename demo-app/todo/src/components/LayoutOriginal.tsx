import type { ReactNode } from 'react'
import { useRef } from 'react'
import type { AppData, ViewState } from '../types'

interface LayoutProps {
  title: string
  children: ReactNode
  sideMenu: ReactNode
  onNew: () => void
  onImport: (data: AppData) => void
  onExport: () => void
  onShare: () => void
  view: ViewState
  onChangeView: (delta: Partial<ViewState>) => void
}

export default function Layout({ title, children, sideMenu, onNew, onImport, onExport, onShare, view, onChangeView }: LayoutProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)

  function triggerImport() {
    fileRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as AppData
      onImport(data)
    } catch {
      alert('Invalid JSON')
    } finally {
      e.target.value = ''
    }
  }

  return (
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="font-semibold tracking-tight">{title}</div>
          <nav className="flex items-center gap-4 text-sm">
            <details className="relative group">
              <summary className="list-none cursor-pointer select-none px-2 py-1 rounded hover:bg-gray-100">File</summary>
              <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white shadow-lg p-2 space-y-1">
                <button onClick={onExport} className="w-full text-left px-2 py-1 rounded hover:bg-gray-100" data-destination="true">Download JSON</button>
                <button onClick={onNew} className="w-full text-left px-2 py-1 rounded hover:bg-gray-100" data-destination="true">New</button>
                <button onClick={triggerImport} className="w-full text-left px-2 py-1 rounded hover:bg-gray-100" data-destination="true">Import JSON</button>
              </div>
            </details>
            <details className="relative group">
              <summary className="list-none cursor-pointer select-none px-2 py-1 rounded hover:bg-gray-100">Share</summary>
              <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white shadow-lg p-2 space-y-1">
                <button onClick={onShare} className="w-full text-left px-2 py-1 rounded hover:bg-gray-100" data-destination="true">Copy URL</button>
              </div>
            </details>
            <details className="relative group">
              <summary className="list-none cursor-pointer select-none px-2 py-1 rounded hover:bg-gray-100">View</summary>
              <div className="absolute right-0 mt-2 w-72 rounded-md border bg-white shadow-lg p-3 space-y-3">
                <label className="flex items-center justify-between gap-2 text-gray-700">
                  <span>Status</span>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={view.statusFilter}
                    onChange={(e) => onChangeView({ statusFilter: e.target.value as ViewState['statusFilter'] })}
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
                <label className="flex items-center justify-between gap-2 text-gray-700">
                  <span>Sort</span>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    data-destination="true"
                    value={view.sortKey}
                    onChange={(e) => onChangeView({ sortKey: e.target.value as ViewState['sortKey'] })}
                  >
                    <option value="dueDate">Due date</option>
                    <option value="status">Status</option>
                  </select>
                </label>
                <label className="flex items-center justify-between gap-2 text-gray-700">
                  <span>Direction</span>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    data-destination="true"
                    value={view.sortDirection}
                    onChange={(e) => onChangeView({ sortDirection: e.target.value as ViewState['sortDirection'] })}
                  >
                    <option value="asc">Asc</option>
                    <option value="desc">Desc</option>
                  </select>
                </label>
              </div>
            </details>
          </nav>
          <input ref={fileRef} onChange={handleFileChange} type="file" accept="application/json" className="hidden" />
        </div>
      </header>
      <div className="flex-1 grid grid-cols-[300px_1fr] min-h-0">
        <aside className="border-r bg-white overflow-y-auto">
          <div className="p-4 space-y-4">{sideMenu}</div>
        </aside>
        <main className="overflow-y-auto">
          <div className="mx-auto max-w-6xl p-4">{children}</div>
        </main>
      </div>
    </div>
  )
}


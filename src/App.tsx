import { useState, useEffect, useRef, type FormEvent } from 'react'
import styles from './App.module.css'

interface Todo {
  id: number
  text: string
  done: boolean
  important: boolean
  date?: string // YYYY-MM-DD or YYYY-MM-DDTHH:mm
  time?: string // HH:mm
}

type View = 'all' | 'important' | 'calendar'
type FilterType = 'all' | 'active' | 'done'

const STORAGE_KEY = 'todos'

function loadTodos(): Todo[] {
  try {
    const raw: Todo[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return raw.map(t => ({ ...t, important: t.important ?? false }))
  } catch {
    return []
  }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

async function decomposeTask(task: string): Promise<string[]> {
  const apiKey = import.meta.env.VITE_MIMO_API_KEY
  const baseUrl = import.meta.env.VITE_MIMO_BASE_URL
  if (!apiKey) throw new Error('请在 .env 中配置 VITE_MIMO_API_KEY')

  const requestBody = {
    model: 'mimo-v2.5-pro',
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: '你是一个任务拆解助手。用户会给出一个任务描述，请将其拆解为若干具体的子任务步骤。只返回一个 JSON 字符串数组，不要包含其他内容。例如：["子任务1", "子任务2", "子任务3"]',
      },
      { role: 'user', content: task },
    ],
  }

  console.log('%c[TaskFlow AI] ═══════════════════════════════', 'color: #6C5CE7; font-weight: bold')
  console.log('%c[TaskFlow AI] >>> 用户输入:', 'color: #00B894; font-weight: bold', `"${task}"`)
  console.log('%c[TaskFlow AI] >>> 调用 Mimo-v2.5-pro API...', 'color: #00B894; font-weight: bold')
  console.log('%c[TaskFlow AI] >>> 请求地址:', 'color: #636E72', `${baseUrl}/chat/completions`)
  console.log('%c[TaskFlow AI] >>> System Prompt:', 'color: #636E72', requestBody.messages[0].content)
  console.log('%c[TaskFlow AI] >>> 请求参数:', 'color: #636E72', JSON.stringify(requestBody, null, 2))

  const startTime = performance.now()

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    const text = await res.text()
    console.log('%c[TaskFlow AI] ✗ API 请求失败:', 'color: #D63031; font-weight: bold', res.status, text)
    throw new Error(`API 请求失败 (${res.status}): ${text}`)
  }

  const data = await res.json()
  const elapsed = (performance.now() - startTime).toFixed(0)
  const content: string = data.choices?.[0]?.message?.content ?? ''

  console.log('%c[TaskFlow AI] <<< 模型原始响应:', 'color: #E17055; font-weight: bold', `"${content}"`)
  console.log('%c[TaskFlow AI] <<< 响应耗时:', 'color: #636E72', `${elapsed}ms`)

  const cleaned = content.replace(/```json\n?|```/g, '').trim()
  const parsed = JSON.parse(cleaned)
  if (!Array.isArray(parsed) || !parsed.every(s => typeof s === 'string')) {
    console.log('%c[TaskFlow AI] ✗ 格式校验失败，期望字符串数组', 'color: #D63031; font-weight: bold')
    throw new Error('API 返回格式不正确，期望字符串数组')
  }

  console.log('%c[TaskFlow AI] ✓ JSON 解析成功:', 'color: #00B894; font-weight: bold', parsed)
  console.log('%c[TaskFlow AI] ✓ 成功拆解为', 'color: #00B894; font-weight: bold', parsed.length, '个子任务')
  console.log('%c[TaskFlow AI] ═══════════════════════════════', 'color: #6C5CE7; font-weight: bold')

  return parsed
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)
  const [view, setView] = useState<View>('all')
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())

  const inputRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const timeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  const addTodo = (e: FormEvent) => {
    e.preventDefault()
    const input = inputRef.current
    if (!input) return
    const text = input.value.trim()
    if (!text) return
    const date = dateRef.current?.value || undefined
    const time = timeRef.current?.value || undefined
    setTodos(prev => [...prev, { id: Date.now(), text, done: false, important: false, date, time }])
    input.value = ''
    if (dateRef.current) dateRef.current.value = ''
    if (timeRef.current) timeRef.current.value = ''
  }

  const handleDecompose = async () => {
    const input = inputRef.current
    if (!input) return
    const text = input.value.trim()
    if (!text) return
    setLoading(true)
    try {
      const subtasks = await decomposeTask(text)
      const now = Date.now()
      const date = dateRef.current?.value || undefined
      const time = timeRef.current?.value || undefined
      const newTodos = subtasks.map((t, i) => ({ id: now + i, text: t, done: false, important: false, date, time }))
      setTodos(prev => [...prev, ...newTodos])
      console.log('%c[TaskFlow AI] → 子任务已写入待办列表:', 'color: #0984E3; font-weight: bold')
      newTodos.forEach((t, i) => {
        console.log(`%c[TaskFlow AI]   ${i + 1}. ${t.text}`, 'color: #0984E3')
      })
      input.value = ''
      if (dateRef.current) dateRef.current.value = ''
      if (timeRef.current) timeRef.current.value = ''
    } catch (err) {
      alert(err instanceof Error ? err.message : '拆解失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const toggleTodo = (id: number) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const toggleImportant = (id: number) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, important: !t.important } : t))
  }

  const removeTodo = (id: number) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  // Search filter
  let baseTodos = todos
  if (search) {
    baseTodos = todos.filter(t => t.text.toLowerCase().includes(search.toLowerCase()))
  }

  // View filter
  let viewTodos = baseTodos
  if (view === 'important') {
    viewTodos = baseTodos.filter(t => t.important)
  }

  // Status filter (only for all/important views)
  const filtered = viewTodos.filter(t =>
    filter === 'all' ? true : filter === 'active' ? !t.done : t.done
  )

  const total = todos.length
  const doneCount = todos.filter(t => t.done).length
  const importantCount = todos.filter(t => t.important).length

  // Calendar data
  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDayOfWeek(calYear, calMonth)
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

  const todosByDate = new Map<string, Todo[]>()
  todos.forEach(t => {
    if (t.date) {
      const dateKey = t.date.slice(0, 10)
      const arr = todosByDate.get(dateKey) || []
      arr.push(t)
      todosByDate.set(dateKey, arr)
    }
  })

  const selectedDateTodos = selectedDate
    ? (todosByDate.get(selectedDate) || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    : []

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const renderTaskList = (list: Todo[]) => (
    <ul className={styles.todoList}>
      {list.length === 0 ? (
        <li className={styles.empty}>暂无任务</li>
      ) : (
        list.map(t => (
          <li key={t.id} className={`${styles.todoItem} ${t.done ? styles.todoDone : ''}`}>
            <input
              className={styles.todoCheckbox}
              type="checkbox"
              checked={t.done}
              onChange={() => toggleTodo(t.id)}
            />
            <span className={styles.todoText}>{t.text}</span>
            {t.date && <span className={styles.todoDate}>{t.date}{t.time ? ` ${t.time}` : ''}</span>}
            <button
              className={`${styles.starBtn} ${t.important ? styles.starActive : ''}`}
              onClick={() => toggleImportant(t.id)}
              title={t.important ? '取消重要' : '标记重要'}
            >
              {t.important ? '★' : '☆'}
            </button>
            <button className={styles.deleteBtn} onClick={() => removeTodo(t.id)}>&times;</button>
          </li>
        ))
      )}
    </ul>
  )

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>T</div>
          <span>TaskFlow</span>
        </div>
        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${view === 'all' ? styles.navActive : ''}`}
            onClick={() => { setView('all'); setSelectedDate(null) }}
          >
            <span className={styles.navIcon}>&#9776;</span>
            所有任务
          </button>
          <button
            className={`${styles.navItem} ${view === 'important' ? styles.navActive : ''}`}
            onClick={() => { setView('important'); setSelectedDate(null) }}
          >
            <span className={styles.navIcon}>&#9733;</span>
            重要
          </button>
          <button
            className={`${styles.navItem} ${view === 'calendar' ? styles.navActive : ''}`}
            onClick={() => setView('calendar')}
          >
            <span className={styles.navIcon}>&#9201;</span>
            日历
          </button>
        </nav>
        <div className={styles.sidebarFooter}>v1.0.0</div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>&#128269;</span>
            <input
              type="text"
              placeholder="搜索任务…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.headerAvatar}>U</div>
        </header>

        {/* Content */}
        <div className={styles.content}>
          {/* Stats */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconOrange}`}>+</div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{total}</div>
                <div className={styles.statLabel}>总任务</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconTeal}`}>&#10003;</div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{doneCount}</div>
                <div className={styles.statLabel}>已完成</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconPurple}`}>&#9733;</div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{importantCount}</div>
                <div className={styles.statLabel}>重要</div>
              </div>
            </div>
          </div>

          {/* Task Input */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>添加任务</span>
            </div>
            <form className={styles.inputRow} onSubmit={addTodo}>
              <input ref={inputRef} type="text" placeholder="输入一句话描述你的任务…" autoFocus />
              <input ref={dateRef} type="date" className={styles.dateInput} defaultValue={todayStr()} />
              <input ref={timeRef} type="time" className={styles.dateInput} />
              <button type="submit" className={styles.btnPrimary}>添加</button>
            </form>
            <button
              className={styles.btnAI}
              onClick={handleDecompose}
              disabled={loading}
            >
              {loading ? 'AI 拆解中…' : 'AI 智能拆解'}
            </button>
          </div>

          {/* Calendar View */}
          {view === 'calendar' ? (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>{calYear}年 {monthNames[calMonth]}</span>
                <div className={styles.calNav}>
                  <button className={styles.calNavBtn} onClick={prevMonth}>&lsaquo;</button>
                  <button className={styles.calNavBtn} onClick={nextMonth}>&rsaquo;</button>
                </div>
              </div>
              <div className={styles.calendar}>
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                  <div key={d} className={styles.calHeader}>{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e${i}`} className={styles.calEmpty} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayTodos = todosByDate.get(dateStr) || []
                  const isToday = dateStr === todayStr()
                  const isSelected = dateStr === selectedDate
                  return (
                    <button
                      key={day}
                      className={`${styles.calDay} ${isToday ? styles.calToday : ''} ${isSelected ? styles.calSelected : ''} ${dayTodos.length > 0 ? styles.calHasTasks : ''}`}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    >
                      {day}
                      {dayTodos.length > 0 && <span className={styles.calDot} />}
                    </button>
                  )
                })}
              </div>
              {selectedDate && (
                <div className={styles.calDetail}>
                  <span className={styles.calDetailTitle}>{selectedDate} 的任务</span>
                  {renderTaskList(selectedDateTodos)}
                </div>
              )}
            </div>
          ) : (
            /* Task List */
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>
                  {view === 'important' ? '重要任务' : '任务列表'}
                </span>
              </div>
              <div className={styles.filters}>
                {(['all', 'active', 'done'] as const).map(f => (
                  <button
                    key={f}
                    className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === 'all' ? '全部' : f === 'active' ? '进行中' : '已完成'}
                  </button>
                ))}
              </div>
              {renderTaskList(filtered)}
              {filtered.length > 0 && (
                <div className={styles.stats}>
                  {filtered.filter(t => t.done).length} / {filtered.length} 已完成
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

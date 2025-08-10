import { useEffect, useState, useRef } from "react"
import type { Task } from "../types"
import { Link } from "react-router"
import { DateTime, Duration } from "luxon"
import type { WeekdayNumbers } from "luxon"
import "./Calendar.scss"
import confetti from "canvas-confetti"

function DraggableTask({ data, handleDelete, handleToggle }: { data: Task, handleDelete?: (id: number) => void, handleToggle?: (id: number, completed: boolean) => void }) {
    const [popup, setPopup] = useState(false)
    const strikeRef = useRef<HTMLSpanElement>(null)
    const markRef = useRef<HTMLSpanElement>(null)
    const colors = [
        '#f44336',
        '#e91e63',
        '#9c27b0',
        '#673ab7',
        '#3f51b5',
        '#2196f3',
        '#03a9f4',
        '#00bcd4',
        '#009688',
        '#4caf50',
        '#8bc34a',
        '#cddc39',
        '#ffeb3b',
        '#ffc107',
        '#ff9800',
        '#ff5722',
        '#795548',
    ]

    useEffect(() => {
        const strike = strikeRef.current
        const mark = markRef.current
        if (!strike || !mark) return

        const onTransitionEnd = () => {
            const rect = mark.getBoundingClientRect()
            const origin = {
                x: (rect.left + rect.width / 2) / window.innerWidth,
                y: (rect.top + rect.height / 2) / window.innerHeight,
            }

            for (let i = 0; i < 360; i++) {
                confetti({
                    particleCount: 1,
                    spread: 360,
                    origin: origin,
                    startVelocity: Math.sqrt(Math.random()) * 40,
                    colors: [colors[Math.floor(Math.random() * colors.length)]],
                })
            }
        }

        if (data.completed) {
            strike.addEventListener("transitionend", onTransitionEnd)
        }

        return () => strike.removeEventListener("transitionend", onTransitionEnd)
    }, [data.completed, strikeRef, markRef])

    return (
        <li className="task-wrapper">
            <div className="task-item" draggable="true" onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", data.id.toString())
            }} onClick={() => {
                setPopup(!popup)
            }}>
                <span className="task-title" title={data.title}>
                    <span ref={strikeRef} className={`task-strike ${data.completed ? "active" : ""}`}></span>
                    {data.title}
                </span>
                <span ref={markRef} className="task-mark">{data.completed ? "✔️" : "❌"}</span>
            </div>
            {popup && (
                <div className="task-popup">
                    {handleToggle && (
                        <button className="btn" onClick={() => handleToggle(data.id, !data.completed)}>
                            <i className="material-icons">{data.completed ? "check_box" : "check_box_outline_blank"}</i>
                        </button>
                    )}
                    <Link className="btn" to={`/tasks/${data.id}`}>
                        <i className="material-icons">edit</i>
                    </Link>
                    {handleDelete && (
                        <button className="btn" onClick={() => handleDelete(data.id)}>
                            <i className="material-icons">delete</i>
                        </button>
                    )}
                </div>
            )}
        </li>
    )
}

export default function Calendar() {
    const [weekStart, setWeekStart] = useState(1)
    const [dayStart, setDayStart] = useState(Duration.fromISOTime("00:00"))
    const [error, setError] = useState("")
    const [expiredTasks, setExpiredTasks] = useState<Task[]>([])
    const [monthsTasks, setMonthsTasks] = useState<Task[]>([])
    const [calendarTitle, setCalendarTitle] = useState("")

    const [today, setToday] = useState("")
    const [selected, setSelected] = useState("")
    const [calendar, setCalendar] = useState<string[]>([])
    const [calendarAfter, setCalendarAfter] = useState("")
    const [calendarBefore, setCalendarBefore] = useState("")
    const [monthStart, setMonthStart] = useState("")
    const [monthEnd, setMonthEnd] = useState("")
    const [weekdays, setWeekdays] = useState<string[]>([])

    function deleteTask(id: number) {
        fetch(`/api/tasks/${id}`, {
            method: "DELETE",
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) throw new Error("could not update task")
            })
            .catch((err) => setError(err.message))

        setExpiredTasks(expiredTasks.filter(task => task.id !== id))
        setMonthsTasks(monthsTasks.filter(task => task.id !== id))
    }

    function markTask(id: number, completed: boolean) {
        fetch(`/api/tasks/${id}`, {
            method: "PATCH",
            credentials: "include",
            body: JSON.stringify({ completed }),
            headers: { "Content-Type": "application/json" },
        })
            .then((res) => {
                if (!res.ok) throw new Error("could not update task")
            })
            .catch((err) => setError(err.message))

        if (completed) {
            setExpiredTasks(expiredTasks.filter(task => task.id !== id))
        }

        else {
            const task = monthsTasks.find(task => task.id === id)
            if (task && task.planned_at < today) {
                task.completed = false
                setExpiredTasks([...expiredTasks, task])
            }
        }

        setMonthsTasks(monthsTasks.map(task => task.id === id ? { ...task, completed } : task))
    }

    useEffect(() => {
        function setRealToday() {
            const todayString = DateTime.now().minus(dayStart).toISODate()

            if (selected === today) {
                setSelected(todayString)
            }
            setToday(todayString)
        }

        setRealToday()

        const interval = setInterval(setRealToday, 60000);
        return () => clearInterval(interval);
    }, [dayStart, selected]);

    useEffect(() => {
        const selectedDateTime = DateTime.fromISO(selected)

        let startOfMonth = selectedDateTime.startOf("month")
        setMonthStart(startOfMonth.toISODate() || "")

        startOfMonth = startOfMonth.minus({ days: (7 + startOfMonth.weekday - weekStart) % 7 })
        setCalendarAfter(startOfMonth.minus({ days: 1 }).toISODate() || "")

        let endOfMonth = selectedDateTime.endOf("month")
        setMonthEnd(endOfMonth.toISODate() || "")

        endOfMonth = endOfMonth.plus({ days: (7 - ((7 + endOfMonth.weekday - weekStart) % 7) - 1) % 7 })
        setCalendarBefore(endOfMonth.plus({ days: 1 }).toISODate() || "")

        const buildCalendar: string[] = []
        for (let date = startOfMonth; date <= endOfMonth; date = date.plus({ days: 1 })) {
            buildCalendar.push(date.toISODate() || "")
        }

        setCalendar(buildCalendar)
        setCalendarTitle(selectedDateTime.toLocaleString({ month: "long", year: "numeric" }))
    }, [selected, weekStart])

    useEffect(() => {
        const newWeekdays = []
        for (let i = 0; i < 7; i++) {
            newWeekdays.push(DateTime.fromObject({ weekday: (i + weekStart - 1) % 7 + 1 as WeekdayNumbers }).toLocaleString({ weekday: "long" }))
        }
        setWeekdays(newWeekdays)
    }, [weekStart])

    useEffect(() => {
        fetch(`/api/me`, {
            method: "GET",
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) throw new Error("could not get current locale settings")
                return res.json()
            })
            .then((data) => {
                setWeekStart(data.start_of_week)
                setDayStart(Duration.fromISOTime(data.rollover_time))
            })
            .catch((err) => setError(err.message))
    }, [])

    useEffect(() => {
        fetch(`/api/tasks?completed=false&before=${today}`, {
            method: "GET",
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) throw new Error("could not get expired tasks")
                return res.json()
            })
            .then((data) => {
                setExpiredTasks(data)
            })
            .catch((err) => setError(err.message))
    }, [today])

    useEffect(() => {
        fetch(`/api/tasks?after=${calendarAfter}&before=${calendarBefore}`, {
            method: "GET",
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) throw new Error("could not get calendar tasks")
                return res.json()
            })
            .then((data) => {
                setMonthsTasks(data)
            })
            .catch((err) => setError(err.message))
    }, [calendarAfter, calendarBefore])

    return (
        <div className="container">
            {error}

            <h4>Expired Tasks</h4>
            <div className="calendar-day-block calendar-border-fix">
                <ul>
                    {expiredTasks.map((task) => (
                        <DraggableTask data={task} handleDelete={deleteTask} />
                    ))}
                </ul>
            </div>

            <h4>{calendarTitle}</h4>

            <button className="waves-effect waves-light btn" onClick={() => setSelected(DateTime.fromISO(selected).minus({ months: 1 }).toISODate() || "")}>
                <i className="material-icons">chevron_left</i>
            </button>
            <button className="waves-effect waves-light btn" onClick={() => setSelected(DateTime.fromISO(selected).plus({ months: 1 }).toISODate() || "")}>
                <i className="material-icons">chevron_right</i>
            </button>

            <button className="waves-effect waves-light btn" onClick={() => setSelected(today)}>
                <i className="material-icons">today</i>
            </button>

            <div className="input-field">
                <input
                    id="selected"
                    type="date"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                />
                <label htmlFor="selected">Choose Date</label>
            </div>

            <div id="calendar-header">
                {weekdays.map((day) => (
                    <span className="calendar-weekday">{day}</span>
                ))}
            </div>

            <div id="calendar-body" className="calendar-border-fix">
                {calendar.map((date) => (
                    <div className={`calendar-day-block ${date === today ? "calendar-today" : ""} ${date < monthStart || date > monthEnd ? "calendar-wrong-month" : ""}`} onDrop={(e) => {
                        e.preventDefault()
                        const id = parseInt(e.dataTransfer.getData("text/plain"))

                        fetch(`/api/tasks/${id}`, {
                            method: "PATCH",
                            credentials: "include",
                            body: JSON.stringify({ planned_at: date }),
                            headers: { "Content-Type": "application/json" },
                        })
                            .then((res) => {
                                if (!res.ok) throw new Error("could not update task")
                            })
                            .catch((err) => setError(err.message))

                        const calendarTask = monthsTasks.find(task => task.id === id)
                        const expiredTask = expiredTasks.find(task => task.id === id)

                        if (calendarTask) {
                            setMonthsTasks(monthsTasks.map(task => task.id === id ? { ...task, planned_at: date } : task))
                        } else if (expiredTask) {
                            setMonthsTasks([...monthsTasks, { ...expiredTask, planned_at: date }])
                        }

                        if ((calendarTask && calendarTask.completed) || (expiredTask && expiredTask.completed)) {
                            return
                        }

                        if (date < today) {
                            if (expiredTask) {
                                setExpiredTasks(expiredTasks.map(task => task.id === id ? { ...task, planned_at: date } : task))
                            } else if (calendarTask) {
                                setExpiredTasks([...expiredTasks, { ...calendarTask, planned_at: date }])
                            }
                        }

                        else {
                            setExpiredTasks(expiredTasks.filter(task => task.id !== id))
                        }
                    }} onDragOver={(e) => e.preventDefault()}>
                        <span>{date.split("-")[2]}</span>
                        <ul>
                            {monthsTasks.filter(task => task.planned_at === date).map((task) =>
                                date === today
                                    ? <DraggableTask data={task} handleDelete={deleteTask} handleToggle={markTask} />
                                    : <DraggableTask data={task} handleDelete={deleteTask} />
                            )}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    )
}

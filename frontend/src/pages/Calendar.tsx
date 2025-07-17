import { useEffect, useState } from "react"
import type { Task } from "../types"
import { Link } from "react-router"
import { DateTime, Duration } from "luxon"
import "./Calendar.scss"

function DraggableTask({ data, handleDelete, handleToggle }: { data: Task, handleDelete?: (id: number) => void, handleToggle?: (id: number, completed: boolean) => void }) {
    return (
        <li className="task" draggable="true" onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", data.id.toString())
        }}>
            <label>
                <input
                    type="checkbox"
                    className="filled-in"
                    checked={data.completed}
                    disabled={handleToggle === undefined}
                    onChange={(e) => handleToggle && handleToggle(data.id, e.target.checked)}
                />
                <span></span>
            </label>
            <Link to={`/tasks/${data.id}`} title={data.title}>{data.title}</Link>
            {handleDelete &&
                <button onClick={() => handleDelete(data.id)}>
                    <i className="material-icons">delete</i>
                </button>
            }
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
    const [calendar, setCalendar] = useState<String[]>([])
    const [calendarAfter, setCalendarAfter] = useState("")
    const [calendarBefore, setCalendarBefore] = useState("")
    const [monthStart, setMonthStart] = useState("")
    const [monthEnd, setMonthEnd] = useState("")

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

        const buildCalendar: String[] = []
        for (let date = startOfMonth; date <= endOfMonth; date = date.plus({ days: 1 })) {
            buildCalendar.push(date.toISODate() || "")
        }

        setCalendar(buildCalendar)
        setCalendarTitle(selectedDateTime.toLocaleString({ month: "long", year: "numeric" }))
    }, [selected, weekStart])

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
            <div className="calendar-day-block">
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

            <div id="calendar">
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
                            setMonthsTasks(monthsTasks.map(task => task.id === id ? { ...task, planned_at: date as string } : task))
                        } else if (expiredTask) {
                            setMonthsTasks([...monthsTasks, { ...expiredTask, planned_at: date as string }])
                        }

                        if ((calendarTask && calendarTask.completed) || (expiredTask && expiredTask.completed)) {
                            return
                        }

                        if (date < today) {
                            if (expiredTask) {
                                setExpiredTasks(expiredTasks.map(task => task.id === id ? { ...task, planned_at: date as string } : task))
                            } else if (calendarTask) {
                                setExpiredTasks([...expiredTasks, { ...calendarTask, planned_at: date as string }])
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

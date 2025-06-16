import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"

export default function Task() {
    const navigate = useNavigate()

    const { id } = useParams()
    const isNew = id === "new"

    const [title, setTitle] = useState("")
    const [date, setDate] = useState("")
    const [completed, setCompleted] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (isNew) {
            setTitle("")
            setDate("")
            setError("")
            return
        }

        fetch(`/api/tasks/${id}`, {
            method: "GET",
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) throw new Error("failed to fetch task")
                return res.json()
            })
            .then((data) => {
                setTitle(data.title)
                setDate(data.planned_at)
                setCompleted(data.completed)
            })
            .catch((err) => setError(err.message))
    }, [id])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const method = isNew ? "POST" : "PATCH"
        const url = isNew ? `/api/tasks` : `/api/tasks/${id}`
        const body = isNew ? {
            title: title,
            planned_at: date,
        } : {
            title: title,
            planned_at: date,
            completed: completed,
        }

        try {
            const res = await fetch(url, {
                method: method,
                credentials: "include",
                body: JSON.stringify(body),
                headers: { "Content-Type": "application/json" },
            })

            if (!res.ok) {
                const msg = await res.text()
                throw new Error(msg || "failed to save task")
            }

            if (isNew) {
                const taskID = (await res.json())['id']
                navigate(`/tasks/${taskID}`)
            }
        }

        catch (err: any) {
            setError(err.message)
        }
    }

    const onDelete = async () => {
        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: "DELETE",
                credentials: "include",
            })

            if (!res.ok) {
                const msg = await res.text()
                throw new Error(msg || "failed to delete task")
            }

            navigate("/tasks/new")
        }

        catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="container">
            <div className="card">
                <div className="card-content">
                    <span className="card-title">{isNew ? "New Task" : "Edit Task"}</span>

                    <form onSubmit={onSubmit}>
                        <div className="row">
                            <div className="input-field col s12">
                                <input
                                    id="title"
                                    type="text"
                                    value={title}
                                    required
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                                <label htmlFor="title" className={title ? "active" : ""}>Title</label>
                            </div>
                        </div>

                        <div className="row">
                            <div className={`input-field col s12 ${isNew ? "m12" : "m6"}`}>
                                <input
                                    id="date"
                                    type="date"
                                    value={date}
                                    required
                                    onChange={(e) => setDate(e.target.value)}
                                />
                                <label htmlFor="date">Date</label>
                            </div>

                            {!isNew && (
                                <div className="input-field col s12 m6">
                                    <label>
                                        <input
                                            id="completed"
                                            type="checkbox"
                                            checked={completed}
                                            className="filled-in"
                                            onChange={(e) => setCompleted(e.target.checked)}
                                        />
                                        <span>Completed</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="red-text">{error}</div>
                        )}

                        <button type="submit" className="btn green waves-effect waves-light">
                            Save Task
                            <i className="material-icons left">save</i>
                        </button>

                        {!isNew && (
                            <button type="button" className="btn red waves-effect waves-light" onClick={onDelete}>
                                Delete Task
                                <i className="material-icons left">delete</i>
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}

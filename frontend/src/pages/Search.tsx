import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router"
import type { Task } from "../types"
import "./Search.scss"

export default function Search() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [pages, setPages] = useState(0)
    const [loading, setLoading] = useState(true)
    const [params, setParams] = useSearchParams()
    const [error, setError] = useState("")

    const limit = 10
    const currentPage = Number(params.get("page") || "1")

    const updateParam = (key: string, value: string) => {
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        setParams(params)
    }

    const markTask = (taskID: number, completed: boolean) => {
        fetch(`/api/tasks/${taskID}`, {
            method: "PATCH",
            credentials: "include",
            body: JSON.stringify({ completed }),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error("failed to update task")
                return res.json()
            })
            .then((data) => {
                if (params.has("completed")) {
                    updateTaskCount()
                    updateTaskList()
                } else {
                    setTasks(tasks.map((task) => (data.id === task.id ? data : task)))
                }
            })
            .catch((err) => setError(err.message))
    }

    const updateTaskCount = () => {
        const query = new URLSearchParams()
        if (params.has("completed")) {
            query.set("completed", params.get("completed") || "")
        }
        if (params.has("after")) {
            query.set("after", params.get("after") || "")
        }
        if (params.has("before")) {
            query.set("before", params.get("before") || "")
        }

        fetch(`/api/tasks/count?${query.toString()}`, {
            method: "GET",
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) throw new Error("failed to count tasks")
                return res.json()
            })
            .then((data) => {
                setPages(Math.ceil(data.count / limit))
            })
            .catch((err) => setError(err.message))
    }

    const updateTaskList = () => {
        setLoading(true)

        const query = new URLSearchParams(params)
        query.set("limit", String(limit))

        if (query.has("page")) {
            query.set("offset", String((Number(query.get("page")) - 1) * limit))
            query.delete("page")
        }

        fetch(`/api/tasks?${query.toString()}`, {
            method: "GET",
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) throw new Error("failed to fetch tasks")
                return res.json()
            })
            .then((data) => {
                setTasks(data)
            })
            .catch((err) => setError(err.message))

        setLoading(false)
    }

    useEffect(updateTaskCount, [params.get("completed"), params.get("after"), params.get("before")])
    useEffect(updateTaskList, [params])

    return (
        <div className="container">
            <div className="card">
                <div className="card-content">
                    <span className="card-title">Filter Task List</span>

                    <form>
                        <div className="row">
                            <div className="input-field col s6">
                                <input
                                    id="before"
                                    type="date"
                                    value={params.get("before") || ""}
                                    onChange={(e) => updateParam("before", e.target.value)}
                                />
                                <label htmlFor="before">Before</label>
                            </div>

                            <div className="input-field col s6">
                                <input
                                    id="after"
                                    type="date"
                                    value={params.get("after") || ""}
                                    onChange={(e) => updateParam("after", e.target.value)}
                                />
                                <label htmlFor="after">After</label>
                            </div>
                        </div>

                        <div className="row">
                            <div className="input-field col s4">
                                <label>
                                    <input
                                        name="completed"
                                        type="radio"
                                        checked={!params.has("completed")}
                                        onChange={() => updateParam("completed", "")}
                                    />
                                    <span>Both</span>
                                </label>
                            </div>

                            <div className="input-field col s4">
                                <label>
                                    <input
                                        name="completed"
                                        type="radio"
                                        checked={params.get("completed") === "true"}
                                        onChange={() => updateParam("completed", "true")}
                                    />
                                    <span>Done</span>
                                </label>
                            </div>

                            <div className="input-field col s4">
                                <label>
                                    <input
                                        name="completed"
                                        type="radio"
                                        checked={params.get("completed") === "false"}
                                        onChange={() => updateParam("completed", "false")}
                                    />
                                    <span>Todo</span>
                                </label>
                            </div>
                        </div>

                        {error && (
                            <div className="red-text">{error}</div>
                        )}
                    </form>
                </div>
            </div>

            <ul className="pagination">
                <li className={currentPage === 1 ? "disabled" : ""}>
                    <a onClick={() => updateParam("page", String(Math.max(1, currentPage - 1)))}>
                        <i className="material-icons">chevron_left</i>
                    </a>
                </li>

                {[...Array(pages).keys()].map((key) => key + 1).map((idx) => (
                    <li className={(currentPage === idx ? "active" : "")}>
                        <a onClick={() => updateParam("page", String(idx))}>{idx}</a>
                    </li>
                ))}

                <li className={currentPage === pages ? "disabled" : ""}>
                    <a onClick={() => updateParam("page", String(Math.min(pages, currentPage + 1)))}>
                        <i className="material-icons">chevron_right</i>
                    </a>
                </li>

                {currentPage > pages && (
                    <li className="active"><a>{currentPage}</a></li>
                )}
            </ul>

            <table className="striped" id="task-search-results">
                <thead>
                    <tr>
                        <th></th>
                        <th></th>
                        <th>Title</th>
                        <th>
                            Date Planned
                            <i className="material-icons" onClick={() => {
                                updateParam("order_col", "planned_at")
                                updateParam("order_dir", params.get("order_dir") === "asc" ? "desc" : "asc")
                            }}>
                                {params.get("order_col") === "planned_at" ? (params.get("order_dir") === "asc" ? "arrow_drop_down" : "arrow_drop_up") : "import_export"}
                            </i>
                        </th>
                        <th>
                            Date Created
                            <i className="material-icons" onClick={() => {
                                updateParam("order_col", "created_at")
                                updateParam("order_dir", params.get("order_dir") === "asc" ? "desc" : "asc")
                            }}>
                                {params.get("order_col") === "created_at" ? (params.get("order_dir") === "asc" ? "arrow_drop_down" : "arrow_drop_up") : "import_export"}
                            </i>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {loading ? (
                        <td colSpan={5}>
                            <div className="progress">
                                <div className="indeterminate"></div>
                            </div>
                        </td>
                    ) : (
                        tasks.map((task) => (
                            <tr>
                                <td>
                                    <Link to={`/tasks/${task.id}`} className="btn waves-effect waves-light"><i className="material-icons">edit</i></Link>
                                </td>
                                <td>
                                    <label>
                                        <input
                                            type="checkbox"
                                            className="filled-in"
                                            checked={task.completed}
                                            onChange={(e) => markTask(task.id, e.target.checked)}
                                        />
                                        <span></span>
                                    </label>
                                </td>
                                <td>{task.title}</td>
                                <td>{new Date(task.planned_at).toLocaleDateString()}</td>
                                <td>{new Date(task.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}

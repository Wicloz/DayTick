import { useEffect, useState } from "react"

export default function Settings() {
    const [error, setError] = useState("")
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [weekStart, setWeekStart] = useState(1)
    const [dayStart, setDayStart] = useState("00:00")

    const submitPasswordChangeForm = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            setError("passwords do not match")
            return
        }

        try {
            const res = await fetch("/api/me/password", {
                method: "POST",
                credentials: "include",
                body: JSON.stringify({ oldPassword, newPassword }),
                headers: { "Content-Type": "application/json" },
            })

            if (!res.ok) {
                const msg = await res.text()
                throw new Error(msg || "Failed to change password")
            }
        }

        catch (err: any) {
            setError(err.message)
        }
    }

    const submitSettingsForm = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const res = await fetch("/api/me", {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify({
                    start_of_week: weekStart,
                    rollover_time: dayStart,
                }),
                headers: { "Content-Type": "application/json" },
            })

            if (!res.ok) {
                const msg = await res.text()
                throw new Error(msg || "Failed to change settings")
            }
        }

        catch (err: any) {
            setError(err.message)
        }
    }

    useEffect(() => {
        import('materialize-css').then((M) => {
            M.FormSelect.init(document.querySelectorAll('select'));
        })
    }, [])

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
                setDayStart(data.rollover_time)
            })
            .catch((err) => setError(err.message))
    }, [])

    return (
        <div className="container">
            <div className="card">
                <div className="card-content">
                    <span className="card-title">Change Password</span>

                    <form onSubmit={submitPasswordChangeForm}>
                        <div className="row">
                            <div className="input-field col s12">
                                <input
                                    id="oldPassword"
                                    type="password"
                                    value={oldPassword}
                                    required
                                    onChange={(e) => setOldPassword(e.target.value)}
                                />
                                <label htmlFor="oldPassword" className={oldPassword ? "active" : ""}>Old Password</label>
                            </div>
                        </div>

                        <div className="row">
                            <div className="input-field col s12 m6">
                                <input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    required
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <label htmlFor="newPassword" className={newPassword ? "active" : ""}>New Password</label>
                            </div>

                            <div className="input-field col s12 m6">
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    required
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <label htmlFor="confirmPassword" className={confirmPassword ? "active" : ""}>Confirm Password</label>
                            </div>
                        </div>

                        {error && (
                            <div className="red-text">{error}</div>
                        )}

                        <button type="submit" className="btn waves-effect waves-light">
                            Update
                        </button>
                    </form>
                </div>
            </div>

            <div className="card">
                <div className="card-content">
                    <span className="card-title">Change Locale Settings</span>

                    <form onSubmit={submitSettingsForm}>
                        <div className="row">
                            <div className="input-field col s12 m6">
                                <input
                                    id="dayStart"
                                    type="time"
                                    value={dayStart}
                                    required
                                    onChange={(e) => setDayStart(e.target.value)}
                                />
                                <label htmlFor="dayStart">Day Start</label>
                            </div>

                            <div className="input-field col s12 m6">
                                <select id="weekStart" value={weekStart} onChange={(e) => setWeekStart(Number(e.target.value))}>
                                    <option value={1}>Monday</option>
                                    <option value={2}>Tuesday</option>
                                    <option value={3}>Wednesday</option>
                                    <option value={4}>Thursday</option>
                                    <option value={5}>Friday</option>
                                    <option value={6}>Saturday</option>
                                    <option value={7}>Sunday</option>
                                </select>
                                <label>Week Start</label>
                            </div>
                        </div>

                        {error && (
                            <div className="red-text">{error}</div>
                        )}

                        <button type="submit" className="btn waves-effect waves-light">
                            Update
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

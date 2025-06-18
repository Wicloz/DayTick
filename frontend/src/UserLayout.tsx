import { useEffect, useState } from "react"
import { useNavigate, Link, Outlet } from "react-router"

export default function UserLayout() {
    const navigate = useNavigate()
    const [loggingOut, setLoggingOut] = useState(false)

    useEffect(() => {
        import('materialize-css').then((M) => {
            M.FloatingActionButton.init(document.querySelectorAll('#corner-menu-button'), {
                hoverEnabled: false,
            })
        })
    })

    const logout = async () => {
        if (loggingOut) return
        setLoggingOut(true)

        const res = await fetch("/api/logout", {
            method: "POST",
            credentials: "include",
        })

        if (!res.ok) {
            const msg = await res.text()
            setLoggingOut(false)
            throw new Error(msg || "Logout Failed")
        }

        setLoggingOut(false)
        navigate("/login")
    }

    return (
        <>
            <Outlet />

            <div className="fixed-action-btn" id="corner-menu-button">
                <a className="btn-floating btn-large">
                    <i className="large material-icons">menu</i>
                </a>
                <ul>
                    <li><a className={`btn-floating red ${loggingOut ? "pulse" : ""}`} onClick={logout}><i className="material-icons">logout</i></a></li>
                    <li><Link to="/" className="btn-floating blue"><i className="material-icons">settings</i></Link></li>
                    <li><Link to="/" className="btn-floating blue"><i className="material-icons">calendar_month</i></Link></li>
                    <li><Link to="/tasks/new" className="btn-floating green"><i className="material-icons">add</i></Link></li>
                    <li><Link to="/tasks" className="btn-floating blue"><i className="material-icons">list</i></Link></li>
                </ul>
            </div>
        </>
    )
}

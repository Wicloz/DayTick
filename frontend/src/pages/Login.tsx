import { useState } from "react"
import { useNavigate, Link } from "react-router"

export default function Login() {
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                credentials: "include",
                body: JSON.stringify({ email, password }),
                headers: { "Content-Type": "application/json" },
            })

            if (!res.ok) {
                const msg = await res.text()
                throw new Error(msg || "Login Failed")
            }

            navigate("/")
        }

        catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="container">
            <div className="card">
                <div className="card-content">
                    <span className="card-title">Login</span>

                    <form onSubmit={onSubmit}>
                        <div className="row">
                            <div className="input-field col s12">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    required
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <label htmlFor="email" className={email ? "active" : ""}>Email</label>
                            </div>
                        </div>

                        <div className="row">
                            <div className="input-field col s12">
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    required
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <label htmlFor="password" className={password ? "active" : ""}>Password</label>
                            </div>
                        </div>

                        {error && (
                            <div className="red-text">{error}</div>
                        )}

                        <button type="submit" className="btn waves-effect waves-light">
                            Login
                        </button>
                    </form>

                    <p>
                        Don't have an account? <Link to="/register">Register!</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

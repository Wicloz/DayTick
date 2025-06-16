import { useState } from "react"
import { useNavigate, Link } from "react-router"

export default function Register() {
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setError("passwords do not match")
            return
        }

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                credentials: "include",
                body: JSON.stringify({ email, password }),
                headers: { "Content-Type": "application/json" },
            })

            if (!res.ok) {
                const msg = await res.text()
                throw new Error(msg || "Registration Failed")
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
                    <span className="card-title">Register</span>

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
                            <div className="input-field col s12 m6">
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    required
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <label htmlFor="password" className={password ? "active" : ""}>Password</label>
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
                            Register
                        </button>
                    </form>

                    <p>
                        Already have an account? <Link to="/login">Login!</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { Appbar } from "../components/Appbar"
import { Balance } from "../components/Balance"
import { Users } from "../components/Users"
import { api, getAuthHeaders } from "../lib/api";

export const Dashboard = () => {
    const [balance, setBalance] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        const loadDashboard = async () => {
            try {
                const [balanceResponse, userResponse] = await Promise.all([
                    api.get("/account/balance", {
                        headers: getAuthHeaders()
                    }),
                    api.get("/user/me", {
                        headers: getAuthHeaders()
                    })
                ]);

                if (cancelled) {
                    return;
                }

                setBalance(balanceResponse.data.balance);
                setCurrentUser(userResponse.data.user);
            } catch (requestError) {
                if (cancelled) {
                    return;
                }

                if (requestError.response?.status === 403) {
                    localStorage.removeItem("token");
                    navigate("/signin", { replace: true });
                    return;
                }

                setError("Unable to load your dashboard right now.");
            }
        };

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    return <div>
        <Appbar user={currentUser} />
        <div className="m-8">
            {error ? <div className="mb-4 text-sm text-red-600">{error}</div> : null}
            <Balance
                value={
                    balance === null
                        ? "Loading..."
                        : new Intl.NumberFormat("en-IN", {
                            maximumFractionDigits: 2
                        }).format(balance)
                }
            />
            <Users currentUserId={currentUser?._id} />
        </div>
    </div>
}

import { useEffect, useState } from "react"
import { Button } from "./Button"
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";


export const Users = ({ currentUserId }) => {
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            api.get(`/user/bulk?filter=${encodeURIComponent(filter)}`)
                .then(response => {
                    setUsers(response.data.user);
                    setError("");
                })
                .catch(() => {
                    setError("Unable to load users.");
                });
        }, 200);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [filter])

    return <>
        <div className="font-bold mt-6 text-lg">
            Users
        </div>
        <div className="my-2">
            <input onChange={(e) => {
                setFilter(e.target.value)
            }} type="text" placeholder="Search users..." className="w-full px-2 py-1 border rounded border-slate-200"></input>
        </div>
        {error ? <div className="mb-3 text-sm text-red-600">{error}</div> : null}
        <div>
            {users
                .filter((user) => user._id !== currentUserId)
                .map(user => <User key={user._id} user={user} />)}
        </div>
    </>
}

function User({user}) {
    const navigate = useNavigate();

    return <div className="flex justify-between">
        <div className="flex">
            <div className="rounded-full h-12 w-12 bg-slate-200 flex justify-center mt-1 mr-2">
                <div className="flex flex-col justify-center h-full text-xl">
                    {user.firstName[0]}
                </div>
            </div>
            <div className="flex flex-col justify-center h-ful">
                <div>
                    {user.firstName} {user.lastName}
                </div>
            </div>
        </div>

        <div className="flex flex-col justify-center h-ful">
            <Button onClick={() => {
                navigate("/send?id=" + user._id + "&name=" + user.firstName);
            }} label={"Send Money"} />
        </div>
    </div>
}

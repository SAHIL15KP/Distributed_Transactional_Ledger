import { useState } from "react"
import { BottomWarning } from "../components/BottomWarning"
import { Button } from "../components/Button"
import { Heading } from "../components/Heading"
import { InputBox } from "../components/InputBox"
import { SubHeading } from "../components/SubHeading"
import { useNavigate } from "react-router-dom"
import { api } from "../lib/api";

export const Signin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSignin = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.post("/user/signin", {
          username,
          password
        });

        localStorage.setItem("token", response.data.token);
        navigate("/dashboard");
      } catch (requestError) {
        setError(
          requestError.response?.data?.message || "Unable to sign you in."
        );
      } finally {
        setLoading(false);
      }
    };

    return <div className="bg-slate-300 h-screen flex justify-center">
    <div className="flex flex-col justify-center">
      <div className="rounded-lg bg-white w-80 text-center p-2 h-max px-4">
        <Heading label={"Sign in"} />
        <SubHeading label={"Enter your credentials to access your account"} />
        <InputBox
          onChange={(e) => {
            setUsername(e.target.value);
          }}
          placeholder="sahil@gmail.com"
          label={"Email"}
        />
        <InputBox
          onChange={(e) => {
            setPassword(e.target.value);
          }}
          placeholder="123456"
          label={"Password"}
          type="password"
        />
        <div className="pt-4">
          <Button
            onClick={handleSignin}
            label={loading ? "Signing in..." : "Sign in"}
            disabled={loading}
          />
        </div>
        {error ? <div className="pb-2 text-sm text-red-600">{error}</div> : null}
        <BottomWarning label={"Don't have an account?"} buttonText={"Sign up"} to={"/signup"} />
      </div>
    </div>
  </div>
}

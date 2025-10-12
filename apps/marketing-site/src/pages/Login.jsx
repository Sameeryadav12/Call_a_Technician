import { useState } from "react";
import Input from "../components/atoms/Input";
import Button from "../components/atoms/Button";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const eobj = {};
    if (!form.email.trim()) eobj.email = "Email is required";
    if (!form.password.trim()) eobj.password = "Password is required";
    setErrors(eobj);
    if (Object.keys(eobj).length) return;

    alert("Login (mock). We'll wire to real auth later.");
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold">Login</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          error={errors.email}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          error={errors.password}
        />
        <Button type="submit" className="w-full">Sign in</Button>
      </form>
    </div>
  );
}

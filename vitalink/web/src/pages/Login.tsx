import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { serverUrl } from "@/lib/api"
import { toast } from "sonner"

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password })
    if (error) {
      setError(error.message)
      return
    }
    let { data } = await supabase.auth.getSession()
    let role = data?.session?.user?.app_metadata?.role
    if (role !== "patient") {
      try {
        await fetch(`${serverUrl()}/admin/promote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: formData.email, role: "patient" }) })
        const r = await supabase.auth.getSession()
        role = r.data?.session?.user?.app_metadata?.role
      } catch (_) {}
    }
    if (role !== "patient") {
      await supabase.auth.signOut()
      toast.info("Please confirm your email. Check your inbox for the verification link.")
      setError("Email not confirmed yet. Check your inbox to verify.")
      return
    }
    navigate("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">Enter your credentials to login</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Link to="/admin/login">
              <Button variant="ghost" size="sm">Admin Login</Button>
            </Link>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="john.doe@example.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
            </div>
            <Button type="submit" className="w-full">Login</Button>
            {error ? <div className="text-red-500 text-sm">{error}</div> : null}
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">Register</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Login

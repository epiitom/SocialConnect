import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            SocialConnect
          </h1>
          <p className="text-muted-foreground mt-2">Connect with friends and share your world</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}

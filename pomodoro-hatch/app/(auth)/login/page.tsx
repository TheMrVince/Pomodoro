import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#E9F0E4] text-[#25332B]">
      <AuthForm mode="login" />
    </main>
  );
}
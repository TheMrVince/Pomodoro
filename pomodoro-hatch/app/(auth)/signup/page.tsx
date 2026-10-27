import AuthForm from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#E9F0E4] text-[#25332B]">
      <AuthForm mode="signup" />
    </main>
  );
}
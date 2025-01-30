"use client";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Spotlight } from "@/components/ui/Spotlight";
import { useSession, signIn, signOut, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [providers, setProviders] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await getProviders();
      setProviders(res);
    })();
  }, []);

  useEffect(() => {
    if (session) {
      router.push("/dashboard"); // Redirect to /dashboard if session exists
    }
  }, [session, router]);

  return (
    <>
      <div className="h-screen flex justify-center items-center bg-black">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="white"
        />
        {session?.user ? (
          <div className="flex gap-3 md:gap-5">
            <button
              type="button"
              onClick={signOut}
              className="bg-black p-3 rounded-lg text-white font-bold border-2 border-white"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <>
            {providers &&
              Object.values(providers).map((provider) => (
                <button
                  type="button"
                  key={provider.name}
                  onClick={() => signIn(provider.id)}
                  className="bg-black p-3 rounded-lg text-white font-bold border-2 border-white"
                >
                  Sign in
                </button>
              ))}
          </>
        )}
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import {
  Building2,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.username || !formData.password) {
      setFormError("Veuillez remplir tous les champs");
      return;
    }

    try {
      await login(formData.username, formData.password);
      // Redirect to dashboard on success
      router.push("/dashboard");
    } catch (err: any) {
      setFormError(err.message || "Identifiants incorrects");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Login Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="mb-8 flex items-center gap-2">
            <Building2 className="h-10 w-10 text-purple-600" />
            <span className="text-3xl font-bold text-gray-900">ISEB</span>
          </Link>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenue de retour
            </h1>
            <p className="mt-2 text-gray-600">
              Connectez-vous à votre espace client
            </p>
          </div>

          {/* Error Message */}
          {(formError || error) && (
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Erreur de connexion</p>
                <p className="mt-1">{formError || error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email/Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Email ou nom d'utilisateur
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="exemple@email.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mot de passe
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-purple-600 hover:text-purple-500"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-700"
              >
                Se souvenir de moi
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Sign up link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Pas encore de compte ?{" "}
            <Link
              href="/signup"
              className="font-medium text-purple-600 hover:text-purple-500"
            >
              Créer un compte gratuitement
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 rounded-lg bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900">
              Compte de démonstration
            </p>
            <p className="mt-1 text-xs text-blue-700">
              Email: <span className="font-mono">admin</span>
              <br />
              Mot de passe: <span className="font-mono">admin</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="relative hidden lg:block lg:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-[#667eea] to-[#764ba2]">
          {/* Animated background shapes */}
          <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-float rounded-full bg-white/10 blur-3xl"></div>
          <div className="animation-delay-2000 absolute right-1/4 top-1/3 h-96 w-96 animate-float rounded-full bg-white/10 blur-3xl"></div>

          {/* Content */}
          <div className="flex h-full items-center justify-center p-12">
            <div className="max-w-md text-white">
              <h2 className="text-4xl font-bold">
                La compta qui vous fait gagner du temps
              </h2>
              <p className="mt-6 text-xl text-white/90">
                Accédez à votre tableau de bord en temps réel, gérez vos
                documents et pilotez votre activité en quelques clics.
              </p>

              <div className="mt-10 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                    <span className="text-lg">✓</span>
                  </div>
                  <div>
                    <p className="font-medium">Tableau de bord temps réel</p>
                    <p className="mt-1 text-sm text-white/80">
                      Suivez votre trésorerie et votre CA en direct
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                    <span className="text-lg">✓</span>
                  </div>
                  <div>
                    <p className="font-medium">Expert-comptable dédié</p>
                    <p className="mt-1 text-sm text-white/80">
                      Un professionnel à votre écoute 7j/7
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                    <span className="text-lg">✓</span>
                  </div>
                  <div>
                    <p className="font-medium">Automatisation intelligente</p>
                    <p className="mt-1 text-sm text-white/80">
                      OCR, synchronisation bancaire, déclarations automatiques
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Lock,
  Mail,
  User,
  AlertCircle,
  Loader2,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (!formData.acceptTerms) {
      setError("Veuillez accepter les conditions générales");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement signup API call to Odoo
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirect to login or dashboard
      router.push("/login?signup=success");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du compte");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Signup Form */}
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
              Créez votre compte
            </h1>
            <p className="mt-2 text-gray-600">
              Démarrez votre essai gratuit de 30 jours, sans engagement
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Erreur</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Nom complet *
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Jean Dupont"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email professionnel *
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="jean@entreprise.fr"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Company (optional) */}
            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700"
              >
                Entreprise
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  value={formData.company}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Mon Entreprise SARL"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mot de passe *
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Minimum 8 caractères
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirmer le mot de passe *
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                disabled={isLoading}
              />
              <label
                htmlFor="acceptTerms"
                className="ml-2 block text-sm text-gray-700"
              >
                J'accepte les{" "}
                <Link
                  href="/legal/terms"
                  className="text-purple-600 hover:text-purple-500"
                >
                  conditions générales
                </Link>{" "}
                et la{" "}
                <Link
                  href="/legal/privacy"
                  className="text-purple-600 hover:text-purple-500"
                >
                  politique de confidentialité
                </Link>
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
                  Création en cours...
                </>
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Login link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Vous avez déjà un compte ?{" "}
            <Link
              href="/login"
              className="font-medium text-purple-600 hover:text-purple-500"
            >
              Se connecter
            </Link>
          </p>

          {/* Benefits */}
          <div className="mt-8 space-y-3 rounded-lg bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">
              Inclus dans votre essai gratuit :
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Accès complet pendant 30 jours
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Aucune carte bancaire requise
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Support client par email
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Branding (same as login) */}
      <div className="relative hidden lg:block lg:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-[#667eea] to-[#764ba2]">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-float rounded-full bg-white/10 blur-3xl"></div>
          <div className="animation-delay-2000 absolute right-1/4 top-1/3 h-96 w-96 animate-float rounded-full bg-white/10 blur-3xl"></div>

          <div className="flex h-full items-center justify-center p-12">
            <div className="max-w-md text-white">
              <h2 className="text-4xl font-bold">
                Rejoignez des milliers d'entrepreneurs
              </h2>
              <p className="mt-6 text-xl text-white/90">
                Simplifiez votre comptabilité et concentrez-vous sur ce qui
                compte vraiment : votre business.
              </p>

              <div className="mt-10 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                    <span className="text-lg">✓</span>
                  </div>
                  <div>
                    <p className="font-medium">Configuration en 5 minutes</p>
                    <p className="mt-1 text-sm text-white/80">
                      Créez votre compte et commencez immédiatement
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                    <span className="text-lg">✓</span>
                  </div>
                  <div>
                    <p className="font-medium">Migration gratuite</p>
                    <p className="mt-1 text-sm text-white/80">
                      Nous importons vos données de votre ancien logiciel
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                    <span className="text-lg">✓</span>
                  </div>
                  <div>
                    <p className="font-medium">Accompagnement personnalisé</p>
                    <p className="mt-1 text-sm text-white/80">
                      Un expert-comptable dédié dès le premier jour
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

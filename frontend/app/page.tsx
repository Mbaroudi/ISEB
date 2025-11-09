"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Camera,
  CheckCircle,
  CreditCard,
  FileText,
  TrendingUp,
  UserCheck,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: <BarChart3 className="h-8 w-8" />,
      gradient: "from-[#667eea] to-[#764ba2]",
      title: "Tableau de bord en temps réel",
      description:
        "Trésorerie, CA, charges : pilotez votre activité en un coup d'œil avec des données toujours à jour.",
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      gradient: "from-[#f093fb] to-[#f5576c]",
      title: "Connexion bancaire sécurisée",
      description:
        "Synchronisation automatique de vos comptes bancaires. Plus besoin de saisir vos transactions manuellement.",
    },
    {
      icon: <UserCheck className="h-8 w-8" />,
      gradient: "from-[#4facfe] to-[#00f2fe]",
      title: "Expert-comptable dédié",
      description:
        "Un vrai expert-comptable vous accompagne et répond à vos questions. Disponible par chat, mail ou téléphone.",
    },
    {
      icon: <Camera className="h-8 w-8" />,
      gradient: "from-[#fa709a] to-[#fee140]",
      title: "Notes de frais simplifiées",
      description:
        "Prenez en photo vos tickets et justificatifs. OCR intelligent pour extraction automatique des données.",
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      gradient: "from-[#30cfd0] to-[#330867]",
      title: "Reporting et prévisions",
      description:
        "Simulation d'impôt, prévisions de trésorerie et analyses financières pour anticiper votre activité.",
    },
    {
      icon: <FileText className="h-8 w-8" />,
      gradient: "from-[#a8edea] to-[#fed6e3]",
      title: "Factures et devis",
      description:
        "Créez et envoyez vos factures en quelques clics. Suivi des paiements et relances automatiques.",
    },
  ];

  const pricing = [
    {
      name: "Liberté",
      price: "200",
      popular: false,
      features: [
        "Dashboard temps réel",
        "Synchro bancaire",
        "Déclarations TVA",
        "Support email",
      ],
    },
    {
      name: "Sérénité",
      price: "350",
      popular: true,
      features: [
        "Tout Liberté +",
        "Expert-comptable dédié",
        "Bilan annuel",
        "Prévisions trésorerie",
      ],
    },
    {
      name: "PME",
      price: "500",
      popular: false,
      features: [
        "Tout Sérénité +",
        "Multi-utilisateurs",
        "Gestion paie",
        "Support prioritaire",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-[#667eea] to-[#764ba2] px-6 py-24 text-white lg:px-8 lg:py-32"
        x-data="{ shown: false }"
        x-init="setTimeout(() => shown = true, 100)"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-float rounded-full bg-white/10 blur-3xl"></div>
          <div className="animation-delay-2000 absolute right-1/4 top-1/3 h-96 w-96 animate-float rounded-full bg-white/10 blur-3xl"></div>
        </div>

        <div
          className="relative mx-auto max-w-7xl"
          x-show="shown"
          x-transition-enter="transition ease-out duration-1000"
          x-transition-enter-start="opacity-0 transform scale-95 -translate-y-10"
          x-transition-enter-end="opacity-100 transform scale-100 translate-y-0"
        >
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <h1 className="text-5xl font-bold leading-tight lg:text-6xl">
                La compta qui vous fait{" "}
                <span className="underline decoration-yellow-400 decoration-4 underline-offset-8">
                  gagner du temps
                </span>
              </h1>
              <p className="mt-6 text-xl leading-8 text-white/90 lg:text-2xl">
                Tableau de bord en temps réel, expert-comptable dédié et
                automatisation intelligente. Comme Dougs, mais en mieux.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/login">
                  <Button
                    size="xl"
                    variant="default"
                    className="w-full bg-white text-purple-600 hover:bg-gray-100 sm:w-auto"
                  >
                    Accéder à mon espace
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    size="xl"
                    variant="outline"
                    className="w-full border-2 border-white bg-transparent text-white hover:bg-white/10 sm:w-auto"
                  >
                    Découvrir
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/80">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Essai gratuit 30 jours
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Sans engagement
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Support 7j/7
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="bg-gradient-to-br from-[#667eea] to-[#764ba2] px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-white lg:text-5xl">
              Tout pour piloter votre entreprise
            </h2>
            <p className="mt-4 text-xl text-white/80">
              Gagnez du temps sur votre comptabilité et concentrez-vous sur
              votre business
            </p>
          </div>

          <div
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            x-data="{ shown: false }"
            x-intersect="shown = true"
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="group"
                x-show="shown"
                x-transition-enter={`transition ease-out duration-700 delay-${index * 100}`}
                x-transition-enter-start="opacity-0 transform scale-95 translate-y-10"
                x-transition-enter-end="opacity-100 transform scale-100 translate-y-0"
              >
                <div className="card-hover h-full rounded-2xl border-0 bg-white p-8 shadow-lg">
                  <div
                    className={`mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r ${feature.gradient} text-white shadow-lg`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-gray-900 lg:text-5xl">
              Nos Formules
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Des tarifs transparents, sans engagement
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {pricing.map((plan, index) => (
              <div
                key={index}
                className={`card-hover relative rounded-2xl bg-white p-8 shadow-lg ${
                  plan.popular ? "border-2 border-purple-500" : ""
                }`}
                x-data="{ hovered: false }"
                x-on-mouseenter="hovered = true"
                x-on-mouseleave="hovered = false"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-yellow-400 px-4 py-1 text-sm font-bold text-gray-900">
                    Populaire
                  </div>
                )}

                <div className="mb-8 text-center">
                  <h3 className="mb-4 text-2xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-purple-600">
                      {plan.price}€
                    </span>
                    <span className="ml-2 text-gray-500">/mois HT</span>
                  </div>
                </div>

                <ul className="mb-8 space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-gradient-purple text-white"
                      : "border-2 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
                  }`}
                  size="lg"
                >
                  Choisir
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-[#667eea] to-[#764ba2] px-6 py-24 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
            <div className="lg:max-w-2xl">
              <h2 className="text-4xl font-bold lg:text-5xl">
                Passez à la comptabilité nouvelle génération
              </h2>
              <p className="mt-4 text-xl text-white/90">
                Rejoignez les milliers d'entrepreneurs qui ont choisi ISEB pour
                gagner du temps et piloter leur activité sereinement.
              </p>
              <div className="mt-6 flex flex-wrap gap-6 text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Essai gratuit 30 jours
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Sans engagement
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Migration gratuite
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Link href="/login" className="w-full">
                <Button
                  size="xl"
                  className="w-full bg-white text-purple-600 hover:bg-gray-100"
                >
                  Accéder à mon espace
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">ISEB</span>
            </div>

            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} ISEB. Tous droits réservés.
            </p>

            <div className="flex gap-6 text-sm text-gray-600">
              <Link href="/legal" className="hover:text-purple-600">
                Mentions légales
              </Link>
              <Link href="/privacy" className="hover:text-purple-600">
                Confidentialité
              </Link>
              <Link href="/contact" className="hover:text-purple-600">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

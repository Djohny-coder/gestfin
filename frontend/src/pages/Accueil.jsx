import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  CreditCard,
  Wallet,
  Moon,
  Sun,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function Accueil() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  const features = [
    {
      icon: <Wallet className="w-8 h-8" />,
      title: "Gestion Complète des Finances",
      desc: "Suivi en temps réel de tous vos comptes bancaires, portefeuilles et investissements. Centralisez vos données financières en un seul endroit sécurisé.",
      color: "from-green-400 to-emerald-600",
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Facturation Intelligente",
      desc: "Générez des factures professionnelles en quelques clics. Automatisez vos processus de facturation et de paiement pour gagner du temps.",
      color: "from-blue-400 to-cyan-600",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Analyses Avancées",
      desc: "Prenez des décisions intelligentes grâce à nos tableaux de bord analytiques détaillés et nos rapports personnalisés.",
      color: "from-purple-400 to-pink-600",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Prévisions Financières",
      desc: "Anticipez vos flux de trésorerie avec nos algorithmes de prévision basés sur l'IA. Planifiez votre avenir financier avec confiance.",
      color: "from-orange-400 to-red-600",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Sécurité de Niveau Entreprise",
      desc: "Vos données sont protégées par le chiffrement AES-256 et les normes de sécurité bancaires. Conformité RGPD garantie.",
      color: "from-indigo-400 to-blue-600",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Intégrations Rapides",
      desc: "Connectez vos banques, applications de comptabilité et outils de paiement en quelques minutes. Plus de 500 intégrations disponibles.",
      color: "from-yellow-400 to-orange-600",
    },
  ];

  const testimonials = [
    {
      name: "Dame Diasso",
      role: "Directrice Financière",
      company: "TechStart Solutions",
      text: "GestFin a transformé notre processus de gestion financière. Nous avons réduit nos délais de clôture de 40%.",
      avatar: <i className="bi bi-person-badge" />,
    },
    {
      name: "Joseph Abass",
      role: "Entrepreneur",
      company: "Agence Digital Pro",
      text: "Une plateforme intuitive et puissante. Exactement ce qu'il nous fallait pour scaler notre entreprise.",
      avatar: <i className="bi bi-person-badge" />,
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "29",
      description: "Parfait pour les freelances et petits projets",
      features: [
        "Jusqu'à 5 comptes",
        "Rapports mensuels",
        "Support par email",
        "Tableau de bord basique",
        "Intégrations limitées",
      ],
      cta: "Commencer",
      highlighted: false,
    },
    {
      name: "Professionnel",
      price: "79",
      description: "Idéal pour les PME et équipes en croissance",
      features: [
        "Comptes illimités",
        "Rapports en temps réel",
        "Support prioritaire 24/7",
        "Analyses avancées",
        "Intégrations complètes",
        "Automatisations personnalisées",
      ],
      cta: "Essayer maintenant",
      highlighted: true,
    },
    {
      name: "Entreprise",
      price: "Sur devis",
      description: "Solutions sur mesure pour les grandes organisations",
      features: [
        "Tout de Professionnel",
        "Compte manager dédié",
        "API personnalisée",
        "Formation d'équipe",
        "Intégrations custom",
        "SLA garanti 99.9%",
      ],
      cta: "Nous contacter",
      highlighted: false,
    },
  ];

  return (
    <div
      className={`${
        dark ? "bg-gradient-to-b from-[#020617] via-[#0f1629] to-[#020617] text-white" : "bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900"
      } min-h-screen transition-all duration-300`}
    >
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${
          dark ? "bg-[#020617]/80 border-white/10" : "bg-white/80 border-gray-200"
        } backdrop-blur-xl border-b sticky top-0 z-50`}
      >
        <div className="flex justify-between items-center p-6 max-w-7xl mx-auto">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-lg flex items-center justify-center font-bold text-sm">
              GF
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              GestFin
            </h1>
          </motion.div>

          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDark(!dark)}
              className={`p-2 rounded-lg transition ${
                dark
                  ? "bg-white/10 hover:bg-white/20"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/connexion")}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                dark
                  ? "bg-white/10 hover:bg-white/20"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Connexion
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/inscription")}
              className="px-6 py-2 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg transition"
            >
              S'inscrire
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <section className="relative max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center px-6 py-24 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block mb-6"
          >
            <span className="px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-300 text-sm font-semibold flex items-center gap-2">
              <i className="bi bi-stars" /> La solution #1 pour les finances
            </span>
          </motion.div>

          <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-6">
            La gestion financière <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              nouvelle génération
            </span>
          </h1>

          <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-lg">
            Découvrez une plateforme intelligente et intuitive pour suivre, analyser et optimiser vos finances. Avec GestFin, prenez le contrôle total de votre situation financière et accélérez la croissance de votre entreprise.
          </p>

          <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr] mb-12">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/inscription")}
              className="px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-xl transition flex items-center justify-center gap-2"
            >
              Créer un compte utilisateur <ArrowRight size={20} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/connexion")}
              className={`px-8 py-4 rounded-xl font-semibold border-2 transition ${
                dark
                  ? "border-white/30 hover:bg-white/10"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              Se connecter
            </motion.button>
          </div>

          <div className="flex items-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-400" />
              <span>Gratuit pendant 14 jours</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-blue-400" />
              <span>100% Sécurisé</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className={`${
              dark
                ? "bg-gradient-to-br from-white/10 to-white/5 border-white/20"
                : "bg-gradient-to-br from-gray-100 to-white border-gray-200"
            } backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border`}
          >
            <div className="flex justify-between items-center mb-8">
              <div className="space-y-2">
                <div className="h-3 w-32 bg-white/20 rounded-full"></div>
                <div className="h-2 w-24 bg-white/10 rounded-full"></div>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
              </div>
            </div>

            <div className="mb-8">
              <div className="h-40 bg-gradient-to-t from-blue-500/30 via-purple-500/20 to-transparent rounded-2xl relative overflow-hidden">
                <motion.div
                  animate={{ height: ["20%", "60%", "40%", "70%", "50%"] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute bottom-0 left-1/4 w-12 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                ></motion.div>
                <motion.div
                  animate={{ height: ["40%", "30%", "60%", "45%", "65%"] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.2 }}
                  className="absolute bottom-0 left-1/3 w-12 bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-t"
                ></motion.div>
                <motion.div
                  animate={{ height: ["50%", "70%", "35%", "65%", "40%"] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.4 }}
                  className="absolute bottom-0 left-1/2 w-12 bg-gradient-to-t from-purple-500 to-purple-300 rounded-t"
                ></motion.div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-green-500/30 to-emerald-600/20 rounded-xl p-4 border border-green-500/30"
              >
                <div className="h-2 w-16 bg-white/30 rounded mb-3"></div>
                <div className="h-6 w-20 bg-white/40 rounded"></div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-blue-500/30 to-cyan-600/20 rounded-xl p-4 border border-blue-500/30"
              >
                <div className="h-2 w-16 bg-white/30 rounded mb-3"></div>
                <div className="h-6 w-20 bg-white/40 rounded"></div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-10 -right-10 w-32 h-32 border border-blue-500/20 rounded-full"
          ></motion.div>
        </motion.div>
      </section>

      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              GestFin regroupe tous les outils essentiels pour gérer vos finances efficacement et prendre les bonnes décisions.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`group relative overflow-hidden rounded-2xl p-8 border transition ${
                  dark
                    ? "bg-white/5 border-white/10 hover:border-white/20"
                    : "bg-gray-100 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition duration-500`}
                ></div>

                <div className="relative z-10">
                  <div className={`inline-block p-3 rounded-lg bg-gradient-to-br ${feature.color} mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Découvrez comment nos clients utilisent GestFin pour transformer leur gestion financière.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className={`rounded-2xl p-8 border ${
                  dark
                    ? "bg-white/5 border-white/10"
                    : "bg-gray-100 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-bold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400">
                      {testimonial.role} • {testimonial.company}
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 italic">"{testimonial.text}"</p>
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, j) => (
                    <i key={j} className="bi bi-star-fill text-yellow-400" />
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="relative rounded-3xl overflow-hidden p-16 border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20"></div>
              <div className="relative z-10">
                <h2 className="text-5xl font-bold mb-6">
                  Prêt à transformer votre gestion financière ?
                </h2>
                <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                  Rejoignez des milliers d'entreprises qui utilisent GestFin pour optimiser leurs finances et accélérer leur croissance.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/inscription")}
                    className="px-10 py-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-xl transition flex items-center justify-center gap-2"
                  >
                    Créer un compte gratuit <ArrowRight size={20} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-10 py-4 rounded-xl font-semibold border-2 transition ${
                      dark
                        ? "border-white/30 hover:bg-white/10"
                        : "border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    Voir la démo
                  </motion.button>
                </div>
                <p className="text-sm text-gray-400 mt-8">
                  ✓ Essai gratuit 14 jours • ✓ Aucune carte de crédit • ✓ Annulation facile
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer
        className={`border-t ${
          dark ? "border-white/10 bg-[#020617]" : "border-gray-200 bg-gray-50"
        } py-16 px-6`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-lg flex items-center justify-center font-bold text-sm">
                  GF
                </div>
                <h3 className="text-xl font-bold">GestFin</h3>
              </div>
              <p className="text-gray-400 text-sm">
                La plateforme de gestion financière nouvelle génération.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Tarifs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Sécurité
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Intégrations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    À propos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Carrières
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Confidentialité
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Conditions
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Cookies
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    RGPD
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div
            className={`border-t ${
              dark ? "border-white/10" : "border-gray-200"
            } pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400`}
          >
            <p>&copy; Avril 2026 GestFin. Tous droits réservés.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition">
                Twitter
              </a>
              <a href="#" className="hover:text-white transition">
                LinkedIn
              </a>
              <a href="#" className="hover:text-white transition">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

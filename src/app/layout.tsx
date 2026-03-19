"use client"

import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, createContext, useContext, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { FloatingChat } from '@/components/ai-tutor/floating-chat';
import { HallwayNotes } from '@/components/layout/hallway-notes';
import { DailyBrainDump } from '@/components/wellness/daily-brain-dump';
import { doc, updateDoc } from 'firebase/firestore';

// --- TRANSLATION SYSTEM ---
const TRANSLATIONS: Record<string, Record<string, string>> = {
  es: {
    "nav.dashboard": "Dashboard",
    "nav.radar": "Radar de Urgencia",
    "nav.community": "Comunidad",
    "nav.binders": "Mis Binders",
    "nav.syllabus": "Escáner de Syllabus",
    "nav.recorder": "Grabadora de Voz",
    "nav.focus": "Temporizador de Enfoque",
    "nav.prioritization": "Priorización",
    "nav.settings": "Configuración",
    "nav.group.main": "Navegación Principal",
    "nav.footer": "CREADO PARA EL ESTUDIANTE DE ÉLITE",
    "auth.tagline": "Ecosistema de Cerebro Digital"
  },
  en: {
    "nav.dashboard": "Dashboard",
    "nav.radar": "Urgency Radar",
    "nav.community": "Community",
    "nav.binders": "My Binders",
    "nav.syllabus": "Syllabus Scanner",
    "nav.recorder": "Voice Recorder",
    "nav.focus": "Focus Timer",
    "nav.prioritization": "Prioritization",
    "nav.settings": "Settings",
    "nav.group.main": "Main Navigation",
    "nav.footer": "BUILT FOR THE ELITE STUDENT",
    "auth.tagline": "Digital Brain Ecosystem"
  },
  pt: {
    "nav.dashboard": "Painel",
    "nav.radar": "Radar de Urgência",
    "nav.community": "Comunidade",
    "nav.binders": "Meus Binders",
    "nav.syllabus": "Scanner de Syllabus",
    "nav.recorder": "Gravador de Voz",
    "nav.focus": "Timer de Foco",
    "nav.prioritization": "Priorização",
    "nav.settings": "Configurações",
    "nav.group.main": "Navegação Principal",
    "nav.footer": "CONSTRUÍDO PARA O ESTUDANTE DE ELITE",
    "auth.tagline": "Ecossistema de Cérebro Digital"
  },
  fr: {
    "nav.dashboard": "Tableau de bord",
    "nav.radar": "Radar d'Urgence",
    "nav.community": "Communauté",
    "nav.binders": "Mes Binders",
    "nav.syllabus": "Scanner de Syllabus",
    "nav.recorder": "Enregistreur Vocal",
    "nav.focus": "Minuteur de Focus",
    "nav.prioritization": "Priorisation",
    "nav.settings": "Paramètres",
    "nav.group.main": "Navigation Principale",
    "nav.footer": "CONÇU POUR L'ÉTUDIANT D'ÉLITE",
    "auth.tagline": "Écosystème de Cerveau Numérique"
  }
};

const LanguageContext = createContext({
  language: 'es',
  setLanguage: (lang: string) => {},
  t: (key: string) => key,
});

export const useLanguage = () => useContext(LanguageContext);

// --- PANIC MODE CONTEXT ---
const PanicContext = createContext({
  isPanic: false,
  togglePanic: () => {},
});

export const usePanic = () => useContext(PanicContext);

function AuthGuard({ children, setLanguage, language }: { children: React.ReactNode, setLanguage: (l: string) => void, language: string }) {
  const { user, isUserLoading } = useUser()
  const pathname = usePathname()
  const router = useRouter()
  const db = useFirestore()
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])

  const { data: userProfile } = useDoc(userDocRef)

  useEffect(() => {
    if (!isUserLoading && !user && pathname !== "/login") {
      router.push("/login")
    }
  }, [user, isUserLoading, pathname, router])

  // Sync language from profile
  useEffect(() => {
    if (userProfile?.language && userProfile.language !== language) {
      setLanguage(userProfile.language)
    }
  }, [userProfile?.language])

  // Presencia e Inactividad
  useEffect(() => {
    if (!db || !user) return

    const uRef = doc(db, "users", user.uid);

    const updatePresence = (isIdle = false) => {
      updateDoc(uRef, {
        lastActive: new Date().toISOString(),
        currentActivity: pathname === "/" ? "Dashboard" : pathname.split("/").pop() || "Explorando",
        ...(isIdle ? { status: 'offline' } : {})
      }).catch(() => {});
    }

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      
      if (userProfile?.status === 'offline') {
        updateDoc(uRef, { status: 'online' }).catch(() => {})
      }

      inactivityTimerRef.current = setTimeout(() => {
        updatePresence(true) 
      }, 10 * 60 * 1000)
    }

    updatePresence()
    resetInactivityTimer()

    const events = ['mousedown', 'keydown', 'touchstart', 'mousemove']
    events.forEach(evt => window.addEventListener(evt, resetInactivityTimer))

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      events.forEach(evt => window.removeEventListener(evt, resetInactivityTimer))
    }
  }, [db, user, pathname, userProfile?.status]);

  useEffect(() => {
    if (userProfile?.theme) {
      document.documentElement.setAttribute('data-theme', userProfile.theme)
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [userProfile])

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (pathname === "/login") {
    return <>{children}</>
  }

  if (!user && pathname !== "/login") {
    return null
  }

  return (
    <SidebarProvider defaultOpen={true}>
      {children}
    </SidebarProvider>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isPanic, setIsPanic] = useState(false);
  const [language, setLanguage] = useState('es');

  useEffect(() => {
    const saved = localStorage.getItem('uniflow_lang');
    if (saved) setLanguage(saved);
  }, []);

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('uniflow_lang', lang);
  };

  const t = (key: string) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const togglePanic = () => {
    setIsPanic(!isPanic);
  };

  return (
    <html lang={language} className="dark">
      <head>
        <title>UniFlow - Digital Brain for Students</title>
        <meta name="description" content="AI-powered ecosystem for academic productivity and student wellness." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Caveat:wght@400;700&family=Courier+Prime:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className={`font-body antialiased transition-colors duration-500 ${isPanic ? 'bg-black' : 'bg-background'} text-foreground`}>
        <FirebaseClientProvider>
          <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            <PanicContext.Provider value={{ isPanic, togglePanic }}>
              <AuthGuard setLanguage={handleSetLanguage} language={language}>
                {children}
                <DailyBrainDump />
                <FloatingChat />
                <HallwayNotes />
                <Toaster />
              </AuthGuard>
            </PanicContext.Provider>
          </LanguageContext.Provider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

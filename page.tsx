
"use client"

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useUser, useCollection, useMemoFirebase, useFirestore, useDoc } from "@/firebase"
import { usePanic } from "@/app/layout"
import { collection, query, limit, where, doc } from "firebase/firestore"
import { 
  TrendingUp,
  Zap,
  Timer,
  Loader2,
  AlertOctagon,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  BookOpen,
  Wind,
  Clock,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { isPanic, togglePanic } = usePanic()
  
  const [breathingTimer, setBreathingTimer] = useState(60)
  const [showBreathing, setShowBreathing] = useState(false)

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])

  const { data: profile } = useDoc(userProfileRef)

  const bindersQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "users", user.uid, "binders"), 
      where("userId", "==", user.uid),
      where("isArchived", "==", false),
      limit(8)
    )
  }, [db, user])

  const { data: recentBinders } = useCollection(bindersQuery)

  // Manejo del temporizador de respiración al entrar en Modo Pánico
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPanic && breathingTimer > 0) {
      setShowBreathing(true)
      interval = setInterval(() => {
        setBreathingTimer((prev) => prev - 1)
      }, 1000)
    } else if (breathingTimer === 0) {
      setShowBreathing(false)
    }
    
    if (!isPanic) {
      setBreathingTimer(60)
      setShowBreathing(false)
    }

    return () => clearInterval(interval)
  }, [isPanic, breathingTimer])

  if (isUserLoading) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className={cn(
      "flex min-h-screen transition-all duration-700",
      isPanic ? "bg-black" : "bg-background"
    )}>
      <AppSidebar />
      <SidebarInset>
        <header className={cn(
          "flex h-16 shrink-0 items-center justify-between border-b px-4 lg:px-6 sticky top-0 z-50 backdrop-blur-md transition-colors duration-500",
          isPanic ? "border-red-900 bg-red-950/10" : "bg-background/80"
        )}>
          <div className="flex items-center gap-2">
            <SidebarTrigger className={isPanic ? "text-red-500" : ""} />
            <div className="flex flex-col">
              <h1 className={cn("text-xl font-headline font-semibold transition-colors duration-500", isPanic && "text-red-500")}>
                {isPanic ? "PROTOCOLO DE PÁNICO" : "Mi Estantería"}
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                {isPanic ? "Enfoque Selectivo Activo" : profile?.major || "Cerebro Digital UniFlow"}
              </p>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={togglePanic}
            className={cn(
              "gap-2 font-bold uppercase text-[10px] tracking-widest transition-all duration-500 border-red-500/20",
              isPanic 
                ? "bg-red-500/10 text-red-500 border-red-500/50 hover:bg-red-500/20" 
                : "hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
            )}
          >
            {isPanic ? <ShieldAlert className="h-4 w-4 animate-pulse" /> : <AlertOctagon className="h-4 w-4" />}
            {isPanic ? "Desactivar Pánico" : "Modo Pánico"}
          </Button>
        </header>

        <main className="flex-1 space-y-12 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {isPanic && showBreathing ? (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-1000">
              <div className="relative h-48 w-48 flex items-center justify-center">
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping opacity-20" />
                <div className="absolute inset-4 bg-red-500/10 rounded-full animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.2)]" />
                <Wind className="h-16 w-16 text-red-500 animate-bounce" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-headline font-bold text-red-500 tracking-tighter">Inhala... Exhala...</h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Bajando niveles de cortisol para un enfoque óptimo.</p>
                <div className="text-6xl font-headline font-bold text-red-500/50 tabular-nums">
                  {breathingTimer}s
                </div>
              </div>
              <Button variant="ghost" className="text-red-500/40 text-[10px] uppercase font-bold" onClick={() => setBreathingTimer(0)}>
                Saltar Fase de Calma
              </Button>
            </div>
          ) : isPanic && !showBreathing ? (
            <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex flex-col gap-4">
                <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/20 flex items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-headline font-bold text-red-500">Prioridades Críticas</h2>
                    <p className="text-muted-foreground text-sm">Mostrando únicamente tareas con entrega en menos de 24 horas.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                {/* MOCK DE TAREAS CRÍTICAS PARA EL PROTOTIPO */}
                <Card className="border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer group">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-red-500" />
                      </div>
                      <div className="space-y-1">
                        <Badge variant="outline" className="border-red-500 text-red-500 text-[8px] uppercase">Vence en 4h</Badge>
                        <h3 className="text-lg font-bold font-headline">Entrega Final: Taller de Análisis Estructural</h3>
                        <p className="text-xs text-muted-foreground">Ingeniería • Proyecto de Semestre</p>
                      </div>
                    </div>
                    <Button className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 px-6">Enfocar Ahora</Button>
                  </CardContent>
                </Card>

                <Card className="border-red-500/20 bg-card/40 hover:bg-red-500/5 transition-colors cursor-pointer">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[8px] uppercase">Vence en 12h</Badge>
                        <h3 className="text-lg font-bold font-headline">Ensayo: Corrientes Psicológicas Modernas</h3>
                        <p className="text-xs text-muted-foreground">Salud • Lectura Obligatoria</p>
                      </div>
                    </div>
                    <Button variant="outline" className="rounded-xl h-12 px-6 border-red-500/20 hover:border-red-500/50">Abrir Binder</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-700">
                <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-default">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-headline font-bold">0.0/20</div>
                    <Progress value={0} className="h-1.5 mt-3" />
                  </CardContent>
                </Card>

                <Card className="hover:bg-muted/50 transition-colors cursor-default">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Racha de Estudio</CardTitle>
                    <Zap className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-headline font-bold">0 Días</div>
                    <p className="text-[10px] text-muted-foreground mt-2 uppercase font-bold">¡Empieza hoy!</p>
                  </CardContent>
                </Card>

                <Card className="hover:bg-muted/50 transition-colors cursor-default">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Focus Hoy</CardTitle>
                    <Timer className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-headline font-bold">0h 0m</div>
                    <p className="text-[10px] text-muted-foreground mt-2 uppercase font-bold">Meta: 2h diarias</p>
                  </CardContent>
                </Card>

                <Card className="border-secondary/20 bg-secondary/5 hover:bg-secondary/10 transition-colors cursor-default">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">IA Insights</CardTitle>
                    <Sparkles className="h-4 w-4 text-secondary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground italic leading-relaxed">
                      "Tu estantería está lista. Selecciona un libro para iniciar tu sesión de Deep Work."
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
                      <BookOpen className="h-6 w-6 text-primary" /> Libros Recientes
                    </h2>
                    <p className="text-sm text-muted-foreground">Continúa tus apuntes justo donde los dejaste.</p>
                  </div>
                  <Button variant="ghost" className="group text-primary hover:text-primary hover:bg-primary/10" asChild>
                    <Link href="/binders">
                      Explorar estantería completa <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-12 gap-y-16 perspective-1000">
                  {recentBinders?.map(binder => (
                    <Link key={binder.id} href={`/binders/${binder.id}`} className="group block h-full">
                      <div className="relative w-full aspect-[3/4.5] preserve-3d transition-all duration-700 group-hover:rotate-y-[-25deg] group-hover:rotate-x-[5deg] group-hover:scale-105">
                        {/* Book Spine (Lomo) */}
                        <div className="absolute top-0 bottom-0 left-[-30px] w-[35px] bg-black/40 backdrop-blur-md origin-right rotate-y-[-90deg] flex flex-col items-center justify-center p-2 border-r border-white/10 z-10 shadow-2xl">
                          <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest whitespace-nowrap rotate-90 w-max mb-4">
                            {binder.major}
                          </span>
                          <div className="w-[1px] h-12 bg-white/10 mb-4" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap rotate-90 w-max truncate max-w-[150px]">
                            {binder.name}
                          </span>
                        </div>

                        {/* Front Cover */}
                        <div 
                          className="absolute inset-0 rounded-r-lg shadow-2xl overflow-hidden flex flex-col p-6 text-white border-y border-r border-white/10"
                          style={{ 
                            backgroundColor: binder.coverColor || '#262B2C',
                            backgroundImage: binder.coverImageUrl ? `url(${binder.coverImageUrl})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/5" />
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-20 pointer-events-none" />
                          
                          <div className="relative z-20 flex flex-col h-full">
                            <Badge className="bg-black/40 backdrop-blur-md border-white/20 text-[7px] font-bold uppercase tracking-[0.2em] w-fit mb-4">
                              {binder.major}
                            </Badge>
                            
                            <div className="mt-auto space-y-4">
                              <div className="bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                <h3 className="text-base font-headline font-bold leading-tight line-clamp-2 drop-shadow-md mb-1">
                                  {binder.name}
                                </h3>
                                <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest">
                                  {binder.sheetType}
                                </p>
                              </div>
                              
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-widest opacity-80">
                                  <span>Progreso</span>
                                  <span>0%</span>
                                </div>
                                <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                                  <div className="h-full bg-primary/80 transition-all duration-1000" style={{ width: '0%' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pages (Effect) */}
                        <div className="absolute top-[2px] bottom-[2px] right-[-8px] w-[10px] bg-white/90 rounded-r-sm z-[-1] shadow-md flex flex-col gap-[1px] p-[1px]">
                          {[...Array(15)].map((_, i) => (
                            <div key={i} className="flex-1 bg-black/5" />
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))}
                  
                  {/* Empty Slot / CTA */}
                  <Link href="/binders" className="group block aspect-[3/4.5] border-2 border-dashed border-muted rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center text-muted-foreground hover:text-primary gap-2">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ArrowRight className="h-6 w-6 rotate-[-45deg]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Nuevo Cuaderno</span>
                  </Link>
                </div>
              </div>
            </>
          )}

          {!isPanic && (
            <div className="grid gap-8 md:grid-cols-3 pt-12 border-t">
              <Card className="md:col-span-2 border-primary/10 bg-card/50 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <Sparkles className="h-32 w-32 text-primary" />
                </div>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Tu Cerebro Digital Unificado</CardTitle>
                  <CardDescription className="max-w-md">Entra en cualquier Binder para usar la Inteligencia Universal: OCR, Citador APA y Tutor Paso a Paso en un solo lugar.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-6 bg-muted/10 rounded-xl m-6 border border-border/50">
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                    <Sparkles className="h-10 w-10 text-primary animate-pulse-subtle" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-xl font-headline">Entrada Universal IA Activa</h4>
                    <p className="text-sm text-muted-foreground max-w-sm">Sube fotos de tus libros o fórmulas directamente en tus notas para recibir ayuda inmediata.</p>
                  </div>
                  <Button size="lg" className="gap-2 px-8 shadow-lg shadow-primary/20" asChild>
                    <Link href="/binders">Ver mi Estantería <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-secondary/20 bg-secondary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-headline uppercase tracking-widest text-secondary">Estado de Red</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-secondary/20 shadow-sm">
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse ring-4 ring-green-500/20" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Servidores IA: Estables</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Capacidades del Sistema:</p>
                      <div className="grid gap-2">
                        {['Vision-to-Math', 'APA 7 Auto-Generator', 'Contextual Tutor', 'Stat Analysis'].map((cap) => (
                          <div key={cap} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-[10px] font-bold uppercase tracking-tighter">
                            <div className="h-1 w-1 rounded-full bg-primary" />
                            {cap}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/20 border-dashed">
                  <CardContent className="p-6 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
                      UniFlow v0.1.0 • Stable Release
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>

      <style jsx global>{`
        .perspective-1000 { perspective: 1500px; }
        .preserve-3d { transform-style: preserve-3d; }
        .rotate-y-90-minus { transform: rotateY(-90deg); }
      `}</style>
    </div>
  )
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Zap, Target, Users, ArrowRight, CheckCircle, Play } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <header className="px-4 lg:px-6 h-14 flex items-center backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-purple-400" />
          <span className="font-bold text-white text-xl">MemoryAce</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button 
            variant="ghost" 
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => window.location.href = '/api/login'}
          >
            Sign In
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                  Master Any Subject with
                  <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Spaced Repetition
                  </span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Transform your learning with scientifically-proven spaced repetition. Create multimedia flashcards, 
                  track your progress, and retain knowledge like never before.
                </p>
              </div>
              <div className="space-x-4">
                <Button 
                  onClick={() => window.location.href = '/api/login'}
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 px-8 py-6 text-lg font-semibold"
                >
                  Start Learning Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg"
                  onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-black/20 backdrop-blur-sm">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">
                  Powerful Features for Effective Learning
                </h2>
                <p className="max-w-[900px] text-gray-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to optimize your learning and retention
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                  <Zap className="h-12 w-12 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">Smart Algorithm</h3>
                  <p className="text-gray-300 text-center">
                    Our spaced repetition algorithm adapts to your learning speed, 
                    showing cards just when you're about to forget them.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                  <Target className="h-12 w-12 text-pink-400" />
                  <h3 className="text-xl font-bold text-white">Multimedia Cards</h3>
                  <p className="text-gray-300 text-center">
                    Create rich flashcards with images, audio, and video to 
                    engage multiple senses and improve retention.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center space-y-4 p-6">
                  <Users className="h-12 w-12 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">Progress Analytics</h3>
                  <p className="text-gray-300 text-center">
                    Track your learning progress with detailed analytics and 
                    performance insights to optimize your study sessions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 lg:grid-cols-2 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                  Why Choose MemoryAce?
                </h2>
                <p className="text-gray-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join thousands of learners who have transformed their study habits 
                  and achieved better results with our proven system.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-gray-300">Scientifically proven spaced repetition algorithm</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-gray-300">Beautiful, intuitive interface designed for focus</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-gray-300">Comprehensive analytics and progress tracking</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-gray-300">Support for multimedia learning materials</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg blur-xl"></div>
                <Card className="relative bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-white">Ready to Start?</h3>
                        <p className="text-gray-300 mt-2">Create your account and begin learning today</p>
                      </div>
                      <Button 
                        onClick={() => window.location.href = '/api/login'}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 py-6 text-lg font-semibold"
                      >
                        Get Started for Free
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                      <p className="text-xs text-gray-400 text-center">
                        No credit card required • Free forever
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 backdrop-blur-sm bg-white/5">
        <div className="container px-4 md:px-6 py-6 mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <span className="font-bold text-white">MemoryAce</span>
            </div>
            <p className="text-xs text-gray-400 mt-4 sm:mt-0">
              © 2025 MemoryAce. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
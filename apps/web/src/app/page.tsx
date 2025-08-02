import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-islamic-green/5 to-islamic-gold/5">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-islamic-green rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">FM</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">FADDL Match</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-6 py-2 bg-islamic-green text-white rounded-lg hover:bg-islamic-green/90 transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10"
                  }
                }}
              />
            </SignedIn>
          </div>
        </header>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-5xl font-bold text-neutral-900 mb-6 leading-tight">
            Welcome to <span className="text-islamic-green">FADDL Match</span>
          </h2>
          <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
            Your journey into the next chapter of your life begins here. 
            A respectful, Islamic matrimonial platform designed specifically for 
            divorced and widowed Muslims seeking meaningful remarriage opportunities.
          </p>
          
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-8 py-4 bg-islamic-green text-white text-lg rounded-xl hover:bg-islamic-green/90 transition-all transform hover:scale-105 shadow-lg">
                Begin Your Journey
              </button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            <a 
              href="/dashboard" 
              className="inline-block px-8 py-4 bg-islamic-green text-white text-lg rounded-xl hover:bg-islamic-green/90 transition-all transform hover:scale-105 shadow-lg"
            >
              Go to Dashboard
            </a>
          </SignedIn>
        </div>

        {/* Value Propositions */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-neutral-100">
            <div className="w-16 h-16 bg-islamic-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-islamic-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-3">Muslim Values First</h3>
            <p className="text-neutral-600">
              Every feature designed with Islamic principles at heart. 
              Halal interactions, respectful communication, and guardian involvement.
            </p>
          </div>

          <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-neutral-100">
            <div className="w-16 h-16 bg-islamic-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-islamic-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-3">Privacy Controls</h3>
            <p className="text-neutral-600">
              Advanced privacy settings with photo visibility controls, 
              guardian oversight, and secure communication channels.
            </p>
          </div>

          <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-neutral-100">
            <div className="w-16 h-16 bg-islamic-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-islamic-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-3">Serious Intentions</h3>
            <p className="text-neutral-600">
              A platform for those ready for marriage, not casual dating. 
              Meaningful connections with family involvement and support.
            </p>
          </div>
        </div>

        {/* Success Stories Preview */}
        <div className="bg-white rounded-2xl p-8 mb-16 border border-neutral-100">
          <h3 className="text-2xl font-bold text-center text-neutral-900 mb-8">Success Stories</h3>
          <div className="text-center text-neutral-600">
            <p className="italic mb-4">
              "FADDL Match helped me find my perfect match while respecting my Islamic values. 
              The guardian involvement feature gave my family confidence in the process."
            </p>
            <p className="font-semibold">- Aisha, Singapore</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-neutral-500 border-t border-neutral-200 pt-8">
          <p>&copy; 2024 FADDL Match. Built with Islamic values and modern technology.</p>
          <div className="flex justify-center space-x-6 mt-4">
            <a href="/privacy" className="hover:text-islamic-green transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-islamic-green transition-colors">Terms</a>
            <a href="/about" className="hover:text-islamic-green transition-colors">About</a>
          </div>
        </footer>
      </div>
    </main>
  )
}
export default function Footer() {
    return (
        <footer className="bg-bg-secondary py-12 border-t border-brand-accent/10">
            <div className="mx-auto max-w-7xl px-6 flex flex-col items-center justify-center text-center space-y-6">

                {/* Brand */}
                <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                    <img src="/iconEventLive.png" alt="EventLive" className="h-10 w-10" />
                    <span className="text-xl font-bold text-brand-dark font-display">EventLive</span>
                </div>

                {/* Simple Copyright / Credit */}
                <div className="text-sm text-text-secondary">
                    <p>&copy; {new Date().getFullYear()} EventLive. All rights reserved.</p>
                    <p className="mt-2 text-xs opacity-60">
                        Designed & Built by <span className="font-semibold text-brand-primary">Chandrasekar</span>
                    </p>
                </div>

            </div>
        </footer>
    );
}

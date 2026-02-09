export default function Hero() {
  return (
    <section className="mb-10 px-4 py-10 rounded-xl bg-gradient-to-r from-primary to-blue-400 text-white shadow-lg relative overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Master your SQLD Exam</h1>
          <p className="text-blue-50 text-lg mb-6 opacity-90 font-light">
            Join over 10,000 developers sharing mock exams, subquery tips, and study strategies.
          </p>
          <div className="flex gap-3">
            <button className="bg-white text-primary px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">
              Start Learning
            </button>
            <button className="bg-primary/20 backdrop-blur-md border border-white/30 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-primary/30 transition-colors">
              Exam Schedule
            </button>
          </div>
        </div>

        {/* D-Day Counter */}
        <div className="hidden md:flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl min-w-[160px]">
          <span className="text-blue-100 text-sm font-medium uppercase tracking-wider">Next Exam</span>
          <span className="text-5xl font-bold text-white mt-1">D-45</span>
          <span className="text-blue-100 text-xs mt-2">March 15, 2024</span>
        </div>
      </div>
      
      
    </section>
  );
}

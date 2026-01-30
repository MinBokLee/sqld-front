import { ChevronsRight, Home, Pencil, Search } from "lucide-react";

const exams = [
  { id: 124, title: "Reviewing Subject 1: Data Modeling Fundamentals (52nd Exam)", author: "SQLMaster", date: "2024-01-20", views: 342, comments: 12, pinned: true },
  { id: 123, title: "Difficult subquery questions from the 51st exam session", author: "DB_Lover", date: "2024-01-19", views: 561, comments: 5 },
  { id: 122, title: "My approach to Window Functions - 52nd Mock Exam", author: "DataScientist", date: "2024-01-19", views: 289, comments: 0 },
  { id: 121, title: "Comparison of Join performance in 50th exam questions", author: "QueryOptimizer", date: "2024-01-18", views: 412, comments: 8 },
  { id: 120, title: "Useful SQL tips for the upcoming 53rd session", author: "PassSQLD", date: "2024-01-18", views: 876, comments: 0 },
  { id: 119, title: "Practice Questions for 'Hierarchical Queries'", author: "Tutor_Kim", date: "2024-01-17", views: 1029, comments: 21 },
];

export default function PracticeExams() {
  return (
    <main className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <a className="hover:text-primary transition-colors flex items-center gap-1" href="#">
          <Home size={16} /> Home
        </a>
        <ChevronsRight size={16} />
        <a className="hover:text-primary transition-colors" href="#">SQLD Study</a>
        <ChevronsRight size={16} />
        <span className="font-semibold text-primary">Practice Exams</span>
      </nav>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">SQLD Practice Exams</h1>
            <p className="text-gray-500 mt-1">Practice with real-world questions and session-based mock tests.</p>
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-blue-600 transition-all shadow-md">
            <Pencil size={16} />
            Write Post
          </button>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <select className="h-10 px-3 rounded-lg border border-gray-300 bg-gray-50 text-sm font-medium focus:ring-primary focus:border-primary">
              <option>All Exams</option>
              <option>52nd Exam</option>
              <option>51st Exam</option>
              <option>50th Exam</option>
              <option>49th Exam</option>
            </select>
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Search size={20} />
              </div>
              <input className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 bg-gray-50 text-sm focus:ring-primary focus:border-primary" placeholder="Search within exams..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-10 px-4 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors">Apply Filter</button>
            <button className="h-10 w-10 flex items-center justify-center bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              <Search size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-16">No.</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-32 text-center">Author</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-32 text-center">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-20 text-center">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exams.map((exam) => (
                <tr key={exam.id} className={`hover:bg-gray-50 transition-colors group ${exam.pinned ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">{exam.id}</td>
                  <td className="px-6 py-4">
                    <a className="text-sm font-medium text-gray-800 group-hover:text-primary transition-colors" href="#">
                      {exam.title}
                      {exam.comments > 0 && <span className="text-primary font-bold text-[11px] ml-1">[{exam.comments}]</span>}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">{exam.author}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">{exam.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">{exam.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

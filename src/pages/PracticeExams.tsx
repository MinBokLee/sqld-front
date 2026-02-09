import { ChevronsRight, Home, Pencil, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

interface Exam {
  id: number;
  title: string;
  author: string;
  date: string;
  views: number;
  comments: number;
}

export default function PracticeExams() {
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    fetch(`/api/board/list`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        const examData = data.result.data.map((item: any) => ({
          id: item.boardId,
          title: item.title,
          author: item.memberId,
          date: new Date(item.createAt).toLocaleDateString(),
          views: item.viewCount,
          comments: 0, // Default value as it is not in the API
        }));
        setExams(examData);
      })
      .catch(error => {
        console.error("Failed to fetch exams:", error);
        // Optionally, set an error state here to display a message to the user
      });
  }, []);

  return (
    <main className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link className="hover:text-primary transition-colors flex items-center gap-1" to="/">
          <Home size={16} /> Home
        </Link>
        <ChevronsRight size={16} />
        <Link className="hover:text-primary transition-colors" to="/practice-exams">SQLD Study</Link>
        <ChevronsRight size={16} />
        <span className="font-semibold text-primary">Practice Exams</span>
      </nav>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Link to="/practice-exams">
              <h1 className="text-3xl font-bold text-gray-800">SQLD Practice Exams</h1>
            </Link>
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
                <tr key={exam.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">{exam.id}</td>
                  <td className="px-6 py-4">
                    <Link className="text-sm font-medium text-gray-800 group-hover:text-primary transition-colors" to={`/exam/${exam.id}`}>
                      {exam.title}
                      {exam.comments > 0 && <span className="text-primary font-bold text-[11px] ml-1">[{exam.comments}]</span>}
                    </Link>
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

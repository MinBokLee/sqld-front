import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChevronsRight, Home, Lightbulb, MessageSquare, Pin, Share2, ThumbsUp, Eye } from "lucide-react";

interface Exam {
  id: number;
  title: string;
  author: string;
  date: string;
  views: number;
  comments: number;
  content: string;
}

export default function ExamDetailPage() {
  const { id } = useParams();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/board/list`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        const examData = data.result.data.find((item: any) => item.boardId === Number(id));
        if (examData) {
          setExam({
            id: examData.boardId,
            title: examData.title,
            author: examData.memberId,
            date: new Date(examData.createAt).toLocaleDateString(),
            views: examData.viewCount,
            comments: 0, // Default value as it is not in the API
            content: examData.content,
          });
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch exam:", error);
        setLoading(false);
        // Optionally, set an error state here to display a message to the user
      });
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-[1280px] mx-auto px-4 md:px-10 py-8 text-center">
        <h1 className="text-2xl font-bold">Loading...</h1>
      </main>
    );
  }

  if (!exam) {
    return (
      <main className="max-w-[1280px] mx-auto px-4 md:px-10 py-8 text-center">
        <h1 className="text-2xl font-bold">Question not found</h1>
        <Link to="/practice-exams" className="text-primary mt-4 inline-block">
          Back to Practice Exams
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link className="hover:text-primary transition-colors" to="/">Home</Link>
        <ChevronsRight size={16} />
        <Link className="hover:text-primary transition-colors" to="/practice-exams">SQLD Study</Link>
        <ChevronsRight size={16} />
        <Link to={`/exam/${exam.id}`} className="font-semibold text-primary">Question Detail</Link>
      </nav>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <article className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded uppercase">Practice Question</span>
                <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">Solved</span>
              </div>
              <Link to={`/exam/${exam.id}`}>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">{exam.title}</h1>
              </Link>
              <div className="flex flex-wrap items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-6 mb-6 gap-4">
                <Link to={`/exam/${exam.id}`} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    <span className="text-gray-500">🧑‍💻</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-white">{exam.author}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Posted on {exam.date}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-6 text-gray-500 dark:text-slate-400 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye size={16} />
                    <span>{exam.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare size={16} />
                    <span>{exam.comments}</span>
                  </div>
                  <button className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Share2 size={16} />
                    <span>Share</span>
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-lg leading-relaxed dark:text-slate-300">
                    {exam.content}
                  </p>
                </div>
                <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                    <span className="text-xs font-mono text-slate-400">PostgreSQL</span>
                    <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                      <Pin size={14} /> Copy
                    </button>
                  </div>
                  <pre className="p-4 text-sm font-mono text-blue-300 overflow-x-auto"><code>SELECT EMP_ID, 
       SALARY,
       DENSE_RANK() OVER (PARTITION BY DEPT_ID ORDER BY SALARY DESC) as RANK
FROM SALARY_TABLE
WHERE RANK = 3;</code></pre>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <button className="group flex items-center p-4 rounded-xl border-2 border-gray-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary transition-all text-left">
                    <span className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-sm mr-4 group-hover:bg-primary group-hover:text-white transition-colors">A</span>
                    <span className="text-sm font-medium dark:text-slate-200">The query will throw a syntax error in the WHERE clause.</span>
                  </button>
                  <button className="group flex items-center p-4 rounded-xl border-2 border-gray-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary transition-all text-left">
                    <span className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-sm mr-4 group-hover:bg-primary group-hover:text-white transition-colors">B</span>
                    <span className="text-sm font-medium dark:text-slate-200">It returns all employees ranked 3rd using DENSE_RANK.</span>
                  </button>
                  <button className="group flex items-center p-4 rounded-xl border-2 border-gray-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary transition-all text-left">
                    <span className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-sm mr-4 group-hover:bg-primary group-hover:text-white transition-colors">C</span>
                    <span className="text-sm font-medium dark:text-slate-200">It returns the same results as using the RANK() function.</span>
                  </button>
                  <button className="group flex items-center p-4 rounded-xl border-2 border-gray-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary transition-all text-left">
                    <span className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-sm mr-4 group-hover:bg-primary group-hover:text-white transition-colors">D</span>
                    <span className="text-sm font-medium dark:text-slate-200">The query returns only one record globally across all departments.</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8">
                <details className="group" open>
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <Link to={`/exam/${exam.id}`} className="flex items-center gap-3">
                      <Lightbulb className="text-primary font-bold" />
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">Answer &amp; Explanation</h3>
                    </Link>
                    <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                  </summary>
                  <div className="mt-6 space-y-4 text-gray-600 dark:text-slate-300 leading-relaxed">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 p-4 rounded-lg">
                      <p className="text-sm"><span className="font-bold text-green-700 dark:text-green-400">Correct Answer: A</span></p>
                    </div>
                    <p>In SQL, you cannot use an alias defined in the <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">SELECT</code> list directly in the <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">WHERE</code> clause of the same query level. This is because of the logical query processing order (FROM -&gt; WHERE -&gt; GROUP BY -&gt; HAVING -&gt; SELECT -&gt; ORDER BY).</p>
                    <p>To filter by a window function result, you must use a subquery or a Common Table Expression (CTE).</p>
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-lg">
                      <p className="text-xs font-bold mb-2 uppercase text-slate-400 tracking-wider">Solution using CTE:</p>
                      <pre className="text-xs font-mono"><code>WITH RankedSalary AS (
    SELECT EMP_ID, SALARY,
           DENSE_RANK() OVER (PARTITION BY DEPT_ID ORDER BY SALARY DESC) as RANK
    FROM SALARY_TABLE
)
SELECT * FROM RankedSalary WHERE RANK = 3;</code></pre>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </article>
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <Link to={`/exam/${exam.id}`} className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                Comments <span className="bg-slate-100 dark:bg-slate-800 text-sm py-0.5 px-2 rounded-full text-gray-500">{exam.comments}</span>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Sort by:</span>
                <select className="text-xs border-none bg-transparent focus:ring-0 font-bold text-primary cursor-pointer">
                  <option>Latest</option>
                  <option>Most Upvoted</option>
                </select>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex-shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined">account_circle</span>
                </div>
                <div className="flex-1">
                  <textarea className="w-full rounded-xl border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-primary focus:border-primary text-sm p-3 min-h-[100px]" placeholder="Add a comment or ask a follow-up question..."></textarea>
                  <div className="mt-2 flex justify-end">
                    <button className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-600 transition-colors">Post Comment</button>
                  </div>
                </div>
              </div>
              <div className="space-y-6 pt-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                    <span className="text-gray-500">🧑‍💻</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm dark:text-white">DB_Master_Joe</span>
                      <span className="text-xs text-gray-500">2 hours ago</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-300">This is a classic "trap" question for the SQLD exam. They always test the order of execution. Thanks for the detailed explanation!</p>
                    <div className="mt-2 flex items-center gap-4 text-xs font-bold text-gray-500">
                      <button className="flex items-center gap-1 hover:text-primary"><ThumbsUp size={14} /> 15</button>
                      <button className="hover:text-primary">Reply</button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pl-14">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                    <span className="text-gray-500 !text-lg">🧑‍🎓</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm dark:text-white">LearningSQL</span>
                      <span className="text-xs text-gray-500">1 hour ago</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-300">Wait, so the alias RANK is strictly only available in ORDER BY if it were the main query?</p>
                    <div className="mt-2 flex items-center gap-4 text-xs font-bold text-gray-500">
                      <button className="flex items-center gap-1 hover:text-primary"><ThumbsUp size={14} /> 3</button>
                      <button className="hover:text-primary">Reply</button>
                    </div>
                  </div>
                </div>
              </div>
              <button className="w-full py-3 text-sm font-bold text-gray-500 hover:text-primary bg-slate-50 dark:bg-slate-800/50 rounded-lg transition-colors">
                Load More Comments
              </button>
            </div>
          </section>
        </div>
        <aside className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-800">
              <Link to={`/exam/${exam.id}`} className="font-bold text-gray-800 dark:text-white">Related Questions</Link>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-800">
              <Link className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group" to="/exam/122">
                <p className="text-sm font-medium dark:text-slate-200 group-hover:text-primary line-clamp-2">Difference between RANK() and DENSE_RANK() in Oracle</p>
                <p className="text-xs text-gray-500 mt-1">24 comments</p>
              </Link>
              <Link className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group" to="/exam/123">
                <p className="text-sm font-medium dark:text-slate-200 group-hover:text-primary line-clamp-2">Using PARTITION BY with aggregate functions</p>
                <p className="text-xs text-gray-500 mt-1">10 comments</p>
              </Link>
              <Link className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group" to="/exam/121">
                <p className="text-sm font-medium dark:text-slate-200 group-hover:text-primary line-clamp-2">52nd Exam Question 12: Set Operators</p>
                <p className="text-xs text-gray-500 mt-1">45 comments</p>
              </Link>
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <Link to="/practice-exams">
            <h4 className="font-bold text-lg mb-2">Practice Mock Exams</h4>
            </Link>
            <p className="text-sm text-blue-100 mb-4 font-light">Get access to 10+ full-length mock exams designed by experts.</p>
            <button className="w-full bg-white text-primary font-bold py-2.5 rounded-lg text-sm hover:bg-blue-50 transition-colors">
              Upgrade to Premium
            </button>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
            <Link to={`/exam/${exam.id}`} className="font-bold text-gray-800 dark:text-white mb-4">Tags</Link>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-gray-500 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">#WindowFunctions</span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-gray-500 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">#52ndExam</span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-gray-500 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">#Intermediate</span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-gray-500 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">#SQLSyntax</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

import { BookOpen } from "lucide-react";

function LearningHub() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#24154f]">
                    Learning Hub
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Cybersecurity resources and learning materials.
                </p>
            </div>

            <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                        <BookOpen size={30} />
                    </div>

                    <h2 className="mt-5 text-xl font-semibold text-gray-800">
                        Coming Soon
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                        Learning resources, cybersecurity news, research papers,
                        case studies and other useful content will be available here.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LearningHub;
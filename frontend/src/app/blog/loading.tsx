export default function Loading() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 animate-pulse flex flex-col gap-6">
            <div className="h-10 bg-gray-200 dark:bg-zinc-800 rounded w-1/3 mb-8 mx-auto"></div>
            {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 border border-gray-100 dark:border-zinc-800 rounded-2xl">
                    <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/4"></div>
                </div>
            ))}
        </div>
    );
}
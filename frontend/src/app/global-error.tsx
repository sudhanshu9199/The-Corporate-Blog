// frontend/src/app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2>Something went wrong globally!</h2>
          <p>{error.message}</p>
          <button onClick={() => reset()} className="p-2 bg-blue-500 text-white rounded">Try again</button>
        </div>
      </body>
    </html>
  )
}
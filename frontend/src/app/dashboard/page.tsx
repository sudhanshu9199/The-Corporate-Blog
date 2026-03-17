export default function DashboardPage() {
  const user = { name: "Sudhanshu", role: "author" };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Welcome back, {user.name}</h1>
      <div className="grid grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h3>My Drafts</h3>
        </div>

        {/* Role based UI */}
        {["admin", "editor"].includes(user.role) && (
          <div className="p-6 bg-blue-50 rounded-xl shadow-sm border border-blue-100">
            <h3 className="text-blue-800 font-semibold">
              Review Pending Posts
            </h3>
            <p className="text-sm text-blue-600">
              Approve or reject community posts.
            </p>
          </div>
        )}

        {user.role === "admin" && (
          <div className="p-6 bg-red-50 rounded-xl shadow-sm border border-red-100">
            <h3 className="text-red-800 font-semibold">User Management</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCard({ children }) {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-100">
      <div className="w-full max-w-md p-10 bg-white border border-gray-200 rounded-lg shadow-md">
        {children}
      </div>
    </div>
  );
}

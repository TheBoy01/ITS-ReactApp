export default function Input({ label, name, ...props }) {
  return (
    <div className="flex flex-col space-y-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        name={name}
        className="w-full px-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
        {...props}
      />
    </div>
  );
}

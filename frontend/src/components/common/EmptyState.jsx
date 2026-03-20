export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center">
        <div className="mb-4 text-5xl">📭</div>
        <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-base text-gray-500 max-w-sm">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}

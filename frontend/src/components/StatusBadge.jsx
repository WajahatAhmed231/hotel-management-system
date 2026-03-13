export default function StatusBadge({ status }) {
  const map = {
    available:   'bg-green-100 text-green-700',
    occupied:    'bg-red-100 text-red-700',
    reserved:    'bg-yellow-100 text-yellow-700',
    cleaning:    'bg-blue-100 text-blue-700',
    maintenance: 'bg-gray-200 text-gray-700',
    confirmed:   'bg-green-100 text-green-700',
    pending:     'bg-yellow-100 text-yellow-700',
    checked_in:  'bg-blue-100 text-blue-700',
    completed:   'bg-gray-100 text-gray-600',
    cancelled:   'bg-red-100 text-red-600',
    paid:        'bg-green-100 text-green-700',
    partial:     'bg-orange-100 text-orange-700',
    dirty:       'bg-red-100 text-red-700',
    in_progress: 'bg-blue-100 text-blue-700',
    clean:       'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

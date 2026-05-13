interface BadgeProps {
  status: 'pending' | 'accepted' | 'rejected' | 'open' | 'matched' | 'paid' | 'completed' | 'delivered' | 'disputed';
  children?: React.ReactNode;
}

const statusConfig = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' },
  accepted: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Accepted' },
  rejected: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Rejected' },
  open: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Open' },
  matched: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Matched' },
  paid: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Paid' },
  completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Completed' },
  delivered: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Delivered' },
  disputed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Disputed' },
};

export const Badge = ({ status }: BadgeProps) => {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};
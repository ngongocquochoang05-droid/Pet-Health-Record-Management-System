interface StatusPillProps {
  status: string;
}

export function StatusPill({ status }: StatusPillProps) {
  const normalized = status.toLowerCase();
  const className =
    normalized === 'confirmed'
      ? 'pill pill-confirmed'
      : normalized === 'cancelled'
        ? 'pill pill-cancelled'
        : normalized === 'no_show'
          ? 'pill pill-cancelled'
        : normalized === 'completed'
          ? 'pill pill-completed'
          : 'pill pill-pending';

  const label =
    normalized === 'pending'
      ? 'Chờ xác nhận'
      : normalized === 'confirmed'
        ? 'Đã xác nhận'
        : normalized === 'cancelled'
          ? 'Đã hủy'
          : normalized === 'completed'
            ? 'Hoàn thành'
            : normalized === 'no_show'
              ? 'Không đến'
              : status;

  return <span className={className}>{label}</span>;
}

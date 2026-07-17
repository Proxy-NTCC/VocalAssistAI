import React from 'react';

interface StatusBadgeProps {
  status: 'New' | 'In Progress' | 'Resolved' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let badgeClass = 'badge-new';
  if (status === 'In Progress') {
    badgeClass = 'badge-progress';
  } else if (status === 'Resolved') {
    badgeClass = 'badge-resolved';
  }

  return (
    <span className={`status-badge ${badgeClass}`}>
      <span className="badge-dot"></span>
      {status}
    </span>
  );
};

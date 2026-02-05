import React from 'react';

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`w-full overflow-auto border border-gray-200 rounded-lg ${className}`}>
    <table className="w-full border-collapse text-sm">{children}</table>
  </div>
);

export const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <thead className={`bg-gray-100 border-b border-gray-200 ${className}`}>
    {children}
  </thead>
);

export const TableBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <tbody className={className}>{children}</tbody>;

export const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <tr className={`border-b border-gray-200 hover:bg-gray-50 ${className}`}>
    {children}
  </tr>
);

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <th className={`px-4 py-3 text-left font-semibold text-gray-700 ${className}`}>
    {children}
  </th>
);

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <td className={`px-4 py-3 text-gray-600 ${className}`}>{children}</td>
);

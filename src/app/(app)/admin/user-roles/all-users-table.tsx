'use client';

import { useMemo, useRef, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { User, Search } from 'lucide-react';
import { addUserRole } from './actions';
import { useTransition } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';

interface AllUserData {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: number;
  role: 'superadmin' | null;
}

interface AllUsersTableProps {
  users: Array<AllUserData>;
}

function RoleCell({ row }: { row: { original: AllUserData } }) {
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (newRole: string) => {
    if (newRole === 'superadmin') {
      startTransition(async () => {
        await addUserRole(row.original.id, newRole);
      });
    }
  };

  return (
    <Select
      value={row.original.role || 'none'}
      onValueChange={handleRoleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No Role</SelectItem>
        <SelectItem value="superadmin">Super Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function AllUsersTable({ users }: AllUsersTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const columns = useMemo<Array<ColumnDef<AllUserData>>>(
    () => [
      {
        id: 'avatar',
        header: () => null,
        cell: ({ row }) => {
          const displayName =
            row.original.firstName || row.original.lastName
              ? `${row.original.firstName || ''} ${row.original.lastName || ''}`.trim()
              : 'Unknown User';

          return (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden ml-2">
              {row.original.imageUrl ? (
                <Image
                  src={row.original.imageUrl}
                  alt={displayName}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          );
        },
      },
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const displayName =
            row.original.firstName || row.original.lastName
              ? `${row.original.firstName || ''} ${row.original.lastName || ''}`.trim()
              : 'Unknown User';

          return <span className="font-medium">{displayName}</span>;
        },
      },
      {
        id: 'username',
        header: 'Username',
        cell: ({ row }) => {
          const username = row.original.username;
          return (
            <span className="text-muted-foreground">
              {username ? `@${username}` : '—'}
            </span>
          );
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'id',
        header: 'User ID',
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground font-mono">
            {getValue() as string}
          </span>
        ),
      },
      {
        id: 'role',
        header: 'Role',
        cell: ({ row }) => <RoleCell row={row} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
        cell: ({ getValue }) => {
          const timestamp = getValue() as number;
          return <span>{format(new Date(timestamp), 'dd. MM. yyyy')}</span>;
        },
      },
    ],
    []
  );

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;

    const lowerQuery = searchQuery.toLowerCase();
    return users.filter((user) => {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
      const username = (user.username || '').toLowerCase();
      const email = (user.email || '').toLowerCase();

      return (
        name.includes(lowerQuery) ||
        username.includes(lowerQuery) ||
        email.includes(lowerQuery)
      );
    });
  }, [users, searchQuery]);

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 73,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  return (
    <div>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <div
        ref={tableContainerRef}
        className="rounded-md border overflow-auto"
        style={{ height: '500px' }}
      >
        <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: `${paddingTop}px` }} />
            </tr>
          )}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <TableRow key={row.id} data-index={virtualRow.index}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: `${paddingBottom}px` }} />
            </tr>
          )}
        </TableBody>
      </Table>
    </div>
    </div>
  );
}

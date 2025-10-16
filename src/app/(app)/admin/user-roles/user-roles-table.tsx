'use client';

import { useMemo, useRef } from 'react';
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
import { Button } from '@/components/ui/button';
import { Trash2, User } from 'lucide-react';
import { updateUserRole, removeUserRole } from './actions';
import { useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';

interface UserRoleData {
  userId: string;
  role: 'superadmin';
  createdAt: Date;
  clerkUser: {
    id: string;
    email: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
}

interface UserRolesTableProps {
  users: UserRoleData[];
}

function RoleCell({ row }: { row: { original: UserRoleData } }) {
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (newRole: 'superadmin') => {
    startTransition(async () => {
      await updateUserRole(row.original.userId, newRole);
    });
  };

  return (
    <Select
      value={row.original.role}
      onValueChange={handleRoleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="superadmin">Super Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}

function ActionsCell({ row }: { row: { original: UserRoleData } }) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      await removeUserRole(row.original.userId);
    });
  };

  const displayName =
    row.original.clerkUser.firstName || row.original.clerkUser.lastName
      ? `${row.original.clerkUser.firstName || ''} ${row.original.clerkUser.lastName || ''}`.trim()
      : 'Unknown User';

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isPending}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove user role?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the role assignment for {displayName} (
            {row.original.clerkUser.email}). This action cannot be undone, but you
            can re-add the user later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function UserRolesTable({ users }: UserRolesTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columns = useMemo<ColumnDef<UserRoleData>[]>(
    () => [
      {
        id: 'avatar',
        header: () => null,
        cell: ({ row }) => {
          const displayName =
            row.original.clerkUser.firstName || row.original.clerkUser.lastName
              ? `${row.original.clerkUser.firstName || ''} ${row.original.clerkUser.lastName || ''}`.trim()
              : 'Unknown User';

          return (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {row.original.clerkUser.imageUrl ? (
                <Image
                  src={row.original.clerkUser.imageUrl}
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
            row.original.clerkUser.firstName || row.original.clerkUser.lastName
              ? `${row.original.clerkUser.firstName || ''} ${row.original.clerkUser.lastName || ''}`.trim()
              : 'Unknown User';

          return <span className="font-medium">{displayName}</span>;
        },
      },
      {
        id: 'username',
        header: 'Username',
        cell: ({ row }) => {
          const username = row.original.clerkUser.username;
          return (
            <span className="text-muted-foreground">
              {username ? `@${username}` : '—'}
            </span>
          );
        },
      },
      {
        accessorKey: 'clerkUser.email',
        header: 'Email',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'userId',
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
        header: 'Role Assigned',
        cell: ({ getValue }) => {
          const date = getValue() as Date;
          return <span>{new Date(date).toLocaleDateString()}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => <ActionsCell row={row} />,
      },
    ],
    []
  );

  const table = useReactTable({
    data: users,
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
  );
}

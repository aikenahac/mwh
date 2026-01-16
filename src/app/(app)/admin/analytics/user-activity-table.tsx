'use client';

import { useMemo, useRef, useState, Fragment } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
  ExpandedState,
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
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Search, ChevronRight, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import type { UserActivity } from '@/lib/api/analytics';

interface UserActivityTableProps {
  data: UserActivity[];
}

export function UserActivityTable({ data }: UserActivityTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const columns = useMemo<ColumnDef<UserActivity>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => {
          return row.original.deckCount > 0 ? (
            <button
              onClick={() => row.toggleExpanded()}
              className="cursor-pointer p-1 hover:bg-muted rounded"
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : null;
        },
      },
      {
        id: 'avatar',
        header: () => null,
        cell: ({ row }) => {
          const displayName =
            row.original.firstName || row.original.lastName
              ? `${row.original.firstName || ''} ${row.original.lastName || ''}`.trim()
              : 'Unknown User';

          return (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {row.original.imageUrl ? (
                <Image
                  src={row.original.imageUrl}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
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
            <span className="text-sm text-muted-foreground">
              {username ? `@${username}` : '—'}
            </span>
          );
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'deckCount',
        header: 'Decks',
        cell: ({ getValue }) => <span className="font-medium">{getValue() as number}</span>,
      },
      {
        accessorKey: 'totalCards',
        header: 'Total Cards',
        cell: ({ getValue }) => <span className="font-medium">{getValue() as number}</span>,
      },
      {
        id: 'cardBreakdown',
        header: 'White / Black',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.whiteCards} / {row.original.blackCards}
          </span>
        ),
      },
      {
        id: 'shares',
        header: 'Shares',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.sharesSent + row.original.sharesReceived}
          </span>
        ),
      },
      {
        accessorKey: 'lastActivity',
        header: 'Last Activity',
        cell: ({ getValue }) => {
          const lastActivity = getValue() as string | null;
          return (
            <span className="text-sm">
              {lastActivity ? format(new Date(lastActivity), 'MMM d, yyyy') : '—'}
            </span>
          );
        },
      },
      {
        accessorKey: 'joinDate',
        header: 'Join Date',
        cell: ({ getValue }) => {
          const joinDate = getValue() as string;
          return <span className="text-sm">{format(new Date(joinDate), 'MMM d, yyyy')}</span>;
        },
      },
    ],
    []
  );

  // Filter users based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const lowerQuery = searchQuery.toLowerCase();
    return data.filter((user) => {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
      const username = (user.username || '').toLowerCase();
      const email = (user.email || '').toLowerCase();

      return (
        name.includes(lowerQuery) ||
        username.includes(lowerQuery) ||
        email.includes(lowerQuery)
      );
    });
  }, [data, searchQuery]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => row.original.deckCount > 0,
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Activity</CardTitle>
        <CardDescription>
          Detailed breakdown of user activity with decks and cards. Click to expand and see
          individual decks.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
          style={{ height: '700px' }}
        >
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
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
                  <Fragment key={row.id}>
                    <TableRow data-index={virtualRow.index}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="bg-muted/50 p-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold mb-2">Decks:</h4>
                            <div className="grid gap-2">
                              {row.original.decks.map((deck) => (
                                <div
                                  key={deck.id}
                                  className="flex items-center justify-between bg-background p-2 rounded-md text-sm"
                                >
                                  <span className="font-medium">{deck.name}</span>
                                  <span className="text-muted-foreground">
                                    {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
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
      </CardContent>
    </Card>
  );
}

'use client';

import { useMemo, useRef, Fragment } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
  Row,
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
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DeleteDeckButton } from './delete-deck-button';
import type { Deck, Card } from '@/lib/db/schema';

interface DeckWithCards extends Deck {
  cards: Card[];
}

interface SystemDecksTableProps {
  decks: DeckWithCards[];
}

export function SystemDecksTable({ decks }: SystemDecksTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columns = useMemo<ColumnDef<DeckWithCards>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={row.getToggleExpandedHandler()}
            className="p-0 h-8 w-8"
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Deck Name',
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'cards',
        header: 'Cards',
        cell: ({ getValue }) => {
          const cards = getValue() as Card[];
          return <span>{cards.length}</span>;
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ getValue }) => {
          const date = getValue() as Date;
          return <span>{new Date(date).toLocaleDateString()}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <DeleteDeckButton
            deckId={row.original.id}
            deckName={row.original.name}
          />
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: decks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
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
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  return (
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
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
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
            const row = rows[virtualRow.index] as Row<DeckWithCards>;
            return (
              <Fragment key={row.id}>
                <TableRow data-index={virtualRow.index}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="bg-muted/30 p-0"
                    >
                      <div className="p-4">
                        <h4 className="text-sm font-semibold mb-3">
                          Cards ({row.original.cards.length})
                        </h4>
                        {row.original.cards.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No cards in this deck.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {row.original.cards.map((card) => (
                              <div
                                key={card.id}
                                className="grid grid-cols-[80px_1fr_80px_80px] gap-4 p-3 rounded-lg border bg-background text-sm items-center"
                              >
                                <span className="font-medium capitalize">
                                  {card.type}
                                </span>
                                <span className="truncate">
                                  {card.text || '(No text)'}
                                </span>
                                <span className="text-muted-foreground text-center">
                                  {card.type === 'black' && card.pick > 1
                                    ? `Pick ${card.pick}`
                                    : '—'}
                                </span>
                                <span className="text-muted-foreground text-xs text-right">
                                  {new Date(
                                    card.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
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
  );
}

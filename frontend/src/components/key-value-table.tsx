import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

interface KeyValueTableProps {
  data: Record<string, string>
  emptyMessage?: string
}

export function KeyValueTable({ data, emptyMessage = "None" }: KeyValueTableProps) {
  const entries = Object.entries(data)

  if (entries.length === 0) {
    return (
      <div className="py-3 text-sm text-muted-foreground text-center">{emptyMessage}</div>
    )
  }

  return (
    <Table>
      <TableBody>
        {entries.map(([key, value]) => (
          <TableRow key={key}>
            <TableCell className="font-medium font-mono text-xs w-1/3 align-top break-all">
              {key}
            </TableCell>
            <TableCell className="font-mono text-xs break-all whitespace-pre-wrap">
              {value || <span className="text-muted-foreground">(empty)</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

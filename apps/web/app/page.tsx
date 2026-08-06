import type { OrgType } from '@stt/types';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const orgTypes: OrgType[] = [
  'brand',
  'supplier',
  'auditor',
  'logistics',
  'regulator',
  'financial',
];

export default function HomePage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'STT Platform';
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <PageWrapper
      title={appName}
      description="Foundation ready — design system and monorepo scaffold"
      actions={<Button>Get started</Button>}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System status</CardTitle>
            <CardDescription>Phase 0 foundation checks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Supabase env</span>
              <Badge variant={supabaseConfigured ? 'default' : 'destructive'}>
                {supabaseConfigured ? 'Configured' : 'Missing'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Shared types</span>
              <Badge>@stt/types</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>UI kit</span>
              <Badge>shadcn/ui</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick search</CardTitle>
            <CardDescription>Input component smoke test</CardDescription>
          </CardHeader>
          <CardContent>
            <Input placeholder="Search organizations, TCs, facilities…" />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Stakeholder roles</CardTitle>
          <CardDescription>From shared OrgType enum</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgTypes.map((type) => (
                <TableRow key={type}>
                  <TableCell className="font-medium">{type}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Planned</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}

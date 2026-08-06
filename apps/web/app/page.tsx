import type { OrgType } from '@stt/types';
import { logoutAction } from '@/app/(auth)/actions';
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
import { createClient } from '@/lib/supabase/server';

const orgTypes: OrgType[] = [
  'brand',
  'supplier',
  'auditor',
  'logistics',
  'regulator',
  'financial',
];

export default async function HomePage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'STT Platform';
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('full_name, organization_id')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null };

  return (
    <PageWrapper
      title={appName}
      description="Foundation ready — auth and design system online"
      actions={
        <form action={logoutAction}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Current authenticated user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span>Email</span>
              <span className="truncate font-medium">{user?.email ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Profile</span>
              <Badge>{profile?.full_name ?? '—'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Organization</span>
              <Badge variant="secondary">
                {profile?.organization_id ? 'Linked' : 'Not linked yet'}
              </Badge>
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

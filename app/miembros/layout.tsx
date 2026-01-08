import { UserLayoutWrapper } from '@/components/user/UserLayoutWrapper';

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserLayoutWrapper>{children}</UserLayoutWrapper>;
}


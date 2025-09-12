import { Card } from '@/components/ui/card';
// import { auth } from '@clerk/nextjs/server';

export default async function HomePage() {
  // const { userId } = await auth();

  // if (!userId) redirect(Routes.SIGN_IN);

  return (
    <Card className="w-full flex items-center justify-center">
      <h1>Home page</h1>
    </Card>
  );
}

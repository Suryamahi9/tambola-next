import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import RoomView from "@/components/room/RoomView";
import { readPlayerToken, PLAYER_COOKIE } from "@/lib/room/engine";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Strangers get the join flow, not an empty room shell.
  const cookieStore = await cookies();
  const me = await readPlayerToken(cookieStore.get(PLAYER_COOKIE)?.value);
  if (!me) redirect("/play");
  return (
    <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 py-6">
      <RoomView roomId={id} />
    </div>
  );
}

import RoomView from "@/components/room/RoomView";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 py-6">
      <RoomView roomId={id} />
    </div>
  );
}

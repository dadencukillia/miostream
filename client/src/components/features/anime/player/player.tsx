import PlayIcon from "~icons/hugeicons/play";


export default function AnimePlayer({ sourceUrl, previewImageUrl }: {
  sourceUrl: string,
  previewImageUrl?: string
}) {
  return (
    <div className="flex w-full relative aspect-video bg-[#1C1C1C] items-center justify-center rounded-xl outline-1 outline-border text-white overflow-hidden">
      <PlayIcon className="size-14 z-1" />
      <div className="absolute inset-0 bg-cover bg-center opacity-25 shadow-[inset_0_0_70px_50px_black]" style={{
        backgroundImage: `url(${previewImageUrl ?? ""})`
      }} />
    </div>
  )
}

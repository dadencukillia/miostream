import PlayIcon from "~icons/hugeicons/play";


export default function AnimePlayer({ sourceUrl }: {
  sourceUrl: string
}) {
  return (
    <div className="flex w-full aspect-video bg-black items-center justify-center rounded-xl border">
      <PlayIcon className="size-14" />
    </div>
  )
}

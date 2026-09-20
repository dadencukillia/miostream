import { Avatar, AvatarImage, AvatarFallback } from "@ui/avatar";

interface Props {
  username: string,
  imageUrl: string,
  className?: string,
  classImg?: string,
  classFallback?: string
}

export default function ProfileAvatar({
  username, imageUrl, className, classImg, classFallback
}: Props) {
  return (
    <Avatar className={ className }>
      <AvatarImage
        src={ imageUrl }
        alt={ "@" + username }
        className={ classImg }
      />
      <AvatarFallback className={ classFallback }>{ username.trim().slice(0, 2).toUpperCase() }</AvatarFallback>
  </Avatar>);
}

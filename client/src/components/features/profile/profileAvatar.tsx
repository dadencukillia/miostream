import { Avatar, AvatarImage, AvatarFallback } from "@ui/avatar";

interface Props {
  username: string,
  imageUrl: string,
  class: string
}

export default function ProfileAvatar({
  username, imageUrl, class: className
}: Props) {
  return (<Avatar>
    <AvatarImage
      src={ imageUrl }
      alt={ "@" + username }
      className={ className }
    />
    <AvatarFallback>{ username.trim().slice(0, 2).toUpperCase() }</AvatarFallback>
  </Avatar>);
}

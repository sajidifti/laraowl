import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { Team, User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
    team = null,
}: {
    user: User;
    showEmail?: boolean;
    team?: Team | null;
}) {
    const getInitials = useInitials();
    const showAvatar = Boolean(user.avatar && user.avatar !== '');

    return (
        <>
            <Avatar className="size-6 overflow-hidden rounded-md border border-border">
                {showAvatar ? (
                    <AvatarImage src={user.avatar} alt={user.name} />
                ) : null}
                <AvatarFallback className="rounded-md bg-muted text-[10px] font-semibold text-foreground">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-medium text-foreground/90">
                    {user.name}
                </span>
                {team ? (
                    <span className="truncate text-[10px] text-muted-foreground">
                        {team.name}
                    </span>
                ) : null}
                {!team && showEmail ? (
                    <span className="truncate text-xs text-foreground/40">
                        {user.email}
                    </span>
                ) : null}
            </div>
        </>
    );
}

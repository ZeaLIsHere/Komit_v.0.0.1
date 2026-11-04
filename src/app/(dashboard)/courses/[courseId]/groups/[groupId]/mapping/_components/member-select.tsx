"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface MemberOption {
  userId: string;
  name: string;
  nim?: string | null;
  username: string;
}

interface MemberSelectProps {
  members: MemberOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MemberSelect({
  members,
  value,
  onChange,
  placeholder = "Pilih anggota kelompok...",
  disabled = false,
}: MemberSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {members.map((member) => (
          <SelectItem key={member.userId} value={member.userId} className="text-xs">
            <span className="font-medium">{member.name || member.username}</span>
            {member.nim ? (
              <span className="text-muted-foreground ml-1">({member.nim})</span>
            ) : (
              <span className="text-muted-foreground ml-1">(@{member.username})</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export type User = {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  status: 'online' | 'offline' | 'away' | 'busy';
  created_at: string;
};

export type Server = {
  id: string;
  name: string;
  icon_url: string | null;
  owner_id: string;
  created_at: string;
};

export type Channel = {
  id: string;
  server_id: string;
  name: string;
  type: 'text' | 'voice';
  position: number;
  created_at: string;
};

export type Message = {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  attachments: string[] | null;
  user?: User;
};

export type ServerMember = {
  id: string;
  server_id: string;
  user_id: string;
  role_id: string | null;
  joined_at: string;
  user?: User;
  role?: Role;
};

export type Role = {
  id: string;
  server_id: string;
  name: string;
  color: string;
  permissions: Record<string, boolean>;
  position: number;
};

export type Friendship = {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  friend?: User;
};

export type DirectMessage = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  user1?: User;
  user2?: User;
};

export type DMMessage = {
  id: string;
  dm_id: string;
  user_id: string;
  content: string;
  created_at: string;
  attachments: string[] | null;
  user?: User;
};
